import { ZodError } from 'zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn(), ingest: vi.fn() }))
vi.mock('payload', async () => {
  const actual = await vi.importActual<typeof import('payload')>('payload')
  return { ...actual, getPayload: mocks.getPayload }
})
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/website-enquiries', () => ({ ingestWebsiteEnquiry: mocks.ingest }))

import { POST } from '@/app/api/integrations/website-enquiries/route'

function request(body = '{}', headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/integrations/website-enquiries', { method: 'POST', headers, body })
}

describe('website enquiry integration endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('WEBSITE_INGEST_TOKEN', 'a-development-only-shared-secret')
    mocks.getPayload.mockResolvedValue({})
  })

  it('rejects missing or invalid bearer credentials without accessing Payload', async () => {
    expect((await POST(request('{}', { 'content-type': 'application/json' }))).status).toBe(401)
    expect((await POST(request('{}', { 'content-type': 'application/json', authorization: 'Bearer wrong' }))).status).toBe(401)
    expect(mocks.getPayload).not.toHaveBeenCalled()
  })

  it('rejects non-JSON and oversized requests before ingestion', async () => {
    expect((await POST(request('{}', { authorization: 'Bearer a-development-only-shared-secret', 'content-type': 'text/plain' }))).status).toBe(415)
    const tooLarge = request(' '.repeat(16 * 1024 + 1), { authorization: 'Bearer a-development-only-shared-secret', 'content-type': 'application/json' })
    expect((await POST(tooLarge)).status).toBe(413)
    expect(mocks.ingest).not.toHaveBeenCalled()
  })

  it('returns creation, replay, conflict, and invalid-input statuses', async () => {
    const headers = { authorization: 'Bearer a-development-only-shared-secret', 'content-type': 'application/json' }
    mocks.ingest.mockResolvedValueOnce({ leadId: 5, created: true }).mockResolvedValueOnce({ leadId: 5, created: false }).mockRejectedValueOnce(new Error('submission_conflict'))
    expect((await POST(request('{}', headers))).status).toBe(201)
    expect((await POST(request('{}', headers))).status).toBe(200)
    expect((await POST(request('{}', headers))).status).toBe(409)
    mocks.ingest.mockRejectedValueOnce(new ZodError([]))
    expect((await POST(request('{}', headers))).status).toBe(400)
  })
})
