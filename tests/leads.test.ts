import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { importBusinessFinderRows } from '../lib/leads'

type StoredLead = Record<string, unknown> & { id: number }

function fakePayload(initial: StoredLead[] = []) {
  const leads = [...initial]
  const payload = {
    async find({ where }: { where?: Record<string, unknown> }) {
      const doc = leads.find((lead) => matchesWhere(lead, where))
      return { docs: doc ? [doc] : [] }
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const lead = { id: leads.length + 1, ...data }
      leads.push(lead)
      return lead
    },
    async update({ id, data }: { id: number; data: Record<string, unknown> }) {
      const index = leads.findIndex((lead) => lead.id === id)
      leads[index] = { ...leads[index], ...data }
      return leads[index]
    },
    leads,
  }
  return payload
}

describe('business finder import', () => {
  it('dedupes by Google place id', async () => {
    const payload = fakePayload([{ id: 1, business_name: 'Existing', google_place_id: 'abc', pipeline_status: 'approved' }])

    const result = await importBusinessFinderRows(payload as unknown as Payload, [{ business_name: 'Updated', google_place_id: 'abc', phone: '123' }])

    expect(result).toEqual({ created: 0, updated: 1 })
    expect(payload.leads).toHaveLength(1)
    expect(payload.leads[0].pipeline_status).toBe('approved')
    expect(payload.leads[0].phone).toBe('123')
  })

  it('dedupes by normalized business name and city', async () => {
    const payload = fakePayload([{ id: 1, normalized_business_name: 'a and b roofing', city: 'Leeds' }])

    const result = await importBusinessFinderRows(payload as unknown as Payload, [{ business_name: ' A and B Roofing ', city: 'Leeds' }])

    expect(result).toEqual({ created: 0, updated: 1 })
    expect(payload.leads).toHaveLength(1)
  })

  it('creates new leads when no identity matches', async () => {
    const payload = fakePayload()

    const result = await importBusinessFinderRows(payload as unknown as Payload, [{ business_name: 'New Business', city: 'York' }])

    expect(result).toEqual({ created: 1, updated: 0 })
    expect(payload.leads[0].pipeline_status).toBe('new')
    expect(payload.leads[0].sales_status).toBe('not_contacted')
  })
})

function matchesWhere(lead: StoredLead, where: Record<string, unknown> | undefined): boolean {
  if (!where) return true
  const googlePlace = (where.google_place_id as { equals?: string } | undefined)?.equals
  if (googlePlace) return lead.google_place_id === googlePlace
  const clauses = where.and as Array<Record<string, { equals?: string }>> | undefined
  if (clauses) {
    return clauses.every((clause) => {
      const [field, matcher] = Object.entries(clause)[0]
      return lead[field] === matcher.equals
    })
  }
  return false
}
