import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { ingestWebsiteEnquiry } from '@/lib/website-enquiries'

const enquiry = {
  submissionId: 321,
  businessName: 'Example Bakery',
  name: 'Avery Owner',
  email: 'avery@example.test',
  phone: '555 0100',
  existingWebsite: 'https://example.test',
  need: 'replace_existing',
  goal: 'more_enquiries',
  subject: 'Website update',
  message: 'We need a clearer menu and contact page.',
}

function hash(input: typeof enquiry) {
  const immutable = Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'submissionId'))
  return createHash('sha256').update(JSON.stringify(immutable)).digest('hex')
}

describe('ingestWebsiteEnquiry', () => {
  it('creates a distinct lead keyed by submission ID and replays without duplication', async () => {
    const rows: Array<Record<string, unknown>> = []
    const runs: Array<Record<string, unknown>> = []
    const create = vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection === 'leads') {
        const row = { id: 47, ...data }
        rows.push(row)
        return row
      }
      const run = { id: 81, ...data }
      runs.push(run)
      return run
    })
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'leads' ? rows : runs })),
      create,
    } as unknown as Payload

    const created = await ingestWebsiteEnquiry(payload, enquiry)
    const replay = await ingestWebsiteEnquiry(payload, enquiry)

    expect(created).toEqual({ leadId: 47, created: true })
    expect(replay).toEqual({ leadId: 47, created: false })
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0][0].data).toMatchObject({
      lead_source: 'askeladd-website',
      pipeline_status: 'new',
      sales_status: 'not_contacted',
      website_submission_id: 321,
      website_submission_hash: hash(enquiry),
      qualification_status: 'unreviewed',
      website_status: 'live',
    })
  })

  it('repairs a missing ingestion audit event on an idempotent retry', async () => {
    const leads: Array<Record<string, unknown>> = []
    const runs: Array<Record<string, unknown>> = []
    let failAuditWrite = true
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'leads' ? leads : runs })),
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'leads') {
          const lead = { id: 51, ...data }
          leads.push(lead)
          return lead
        }
        if (failAuditWrite) {
          failAuditWrite = false
          throw new Error('audit write failed')
        }
        const run = { id: 82, ...data }
        runs.push(run)
        return run
      }),
    } as unknown as Payload

    await expect(ingestWebsiteEnquiry(payload, enquiry)).rejects.toThrow('audit write failed')
    await expect(ingestWebsiteEnquiry(payload, enquiry)).resolves.toEqual({ leadId: 51, created: false })
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ operation: 'website_enquiry_ingestion', lead: 51 })
  })


  it('keeps one audit event when concurrent ingestion creates the idempotency key first', async () => {
    const leads: Array<Record<string, unknown>> = []
    const runs: Array<Record<string, unknown>> = []
    let simulateUniqueRace = true
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'leads' ? leads : runs })),
      create: vi.fn(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'leads') {
          const lead = { id: 63, ...data }
          leads.push(lead)
          return lead
        }
        const run = { id: 84, ...data }
        runs.push(run)
        if (simulateUniqueRace) {
          simulateUniqueRace = false
          throw new Error('unique constraint')
        }
        return run
      }),
    } as unknown as Payload

    await expect(ingestWebsiteEnquiry(payload, enquiry)).resolves.toEqual({ leadId: 63, created: true })
    expect(runs).toHaveLength(1)
    expect(runs[0].idempotency_key).toBe('website-enquiry-ingestion:63')
  })
  it('conflicts instead of replacing an existing immutable enquiry', async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [{ id: 92, website_submission_hash: 'different-hash' }] })),
      create: vi.fn(),
    } as unknown as Payload

    await expect(ingestWebsiteEnquiry(payload, enquiry)).rejects.toThrow('submission_conflict')
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects malformed values before creating any record', async () => {
    const payload = { find: vi.fn(), create: vi.fn() } as unknown as Payload

    await expect(ingestWebsiteEnquiry(payload, { ...enquiry, need: 'made-up' })).rejects.toThrow()
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })
  it('rejects non-HTTP website protocols', async () => {
    const payload = { find: vi.fn(), create: vi.fn() } as unknown as Payload

    await expect(ingestWebsiteEnquiry(payload, { ...enquiry, existingWebsite: 'ftp://example.test' })).rejects.toThrow()
    expect(payload.find).not.toHaveBeenCalled()
  })
})

