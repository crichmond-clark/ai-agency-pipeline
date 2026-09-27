import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn(), recordWorkflowRun: vi.fn() }))
vi.mock('payload', async () => {
  const actual = await vi.importActual<typeof import('payload')>('payload')
  return { ...actual, getPayload: mocks.getPayload }
})
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/workflow', () => ({ recordWorkflowRun: mocks.recordWorkflowRun }))

import { POST } from '@/app/api/client-intakes/[intakeId]/review/route'

const paths = ['business_name', 'contact_name', 'contact_email', 'phone', 'website', 'address', 'city', 'business_description', 'services', 'service_areas', 'intended_audience', 'primary_goal', 'brand_guidance', 'supplied_copy', 'external_asset_links', 'unanswered']

describe('POST /api/client-intakes/[intakeId]/review', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.recordWorkflowRun.mockResolvedValue(undefined)
  })

  it('persists decisions and finalizes after every submitted section is reviewed', async () => {
    const intake = {
      id: 12,
      lead: 5,
      status: 'submitted',
      updatedAt: '2026-01-01T00:00:00.000Z',
      answers: Object.fromEntries(paths.map((path) => [path, path === 'business_name' ? 'Example Services' : ''])),
      accepted_facts: {},
      review_decisions: {},
    }
    const execute = vi.fn().mockResolvedValue({ rows: [{ status: 'reviewed', accepted_facts: { business_name: { value: 'Example Services' } } }] })
    const drizzle = {}
    mocks.getPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 7 } }),
      findByID: vi.fn().mockResolvedValue(intake),
      db: { drizzle, execute },
    })
    const decisions = Object.fromEntries(paths.map((path) => [path, path === 'business_name' ? 'accepted' : 'rejected']))

    const response = await POST(new Request('http://localhost/api/client-intakes/12/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decisions, finalize: true }),
    }), { params: Promise.resolve({ intakeId: '12' }) })
    expect(response.status).toBe(200)
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ drizzle, sql: expect.any(Object) }))
    await expect(response.json()).resolves.toMatchObject({ status: 'reviewed' })
    execute.mockResolvedValueOnce({ rows: [] })
    const staleResponse = await POST(new Request('http://localhost/api/client-intakes/12/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decisions, finalize: true }),
    }), { params: Promise.resolve({ intakeId: '12' }) })
    expect(staleResponse.status).toBe(409)
  })
})
