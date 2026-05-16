import type { Payload } from 'payload'

export async function recordWorkflowRun(payload: Payload, data: {
  operation: 'profile_generation' | 'demo_content_generation' | 'screenshot_capture' | 'qa_check'
  status: 'started' | 'succeeded' | 'failed'
  lead?: string | number
  demo_site?: string | number
  outreach_message?: string | number
  summary?: string
  error?: string
  metadata?: Record<string, unknown>
  started_at?: string
}) {
  const now = new Date().toISOString()
  return payload.create({
    collection: 'workflow-runs',
    data: {
      operation: data.operation,
      status: data.status,
      lead: normalizeId(data.lead),
      demo_site: normalizeId(data.demo_site),
      outreach_message: normalizeId(data.outreach_message),
      started_at: data.started_at ?? now,
      finished_at: data.status === 'started' ? undefined : now,
      summary: data.summary,
      error: data.error,
      metadata: data.metadata,
    },
  })
}

function normalizeId(id: string | number | undefined): number | undefined {
  if (typeof id === 'number') return id
  if (!id) return undefined
  const numeric = Number(id)
  return Number.isNaN(numeric) ? undefined : numeric
}
