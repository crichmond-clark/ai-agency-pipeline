import type { Payload } from 'payload'

export async function recordWorkflowRun(payload: Payload, data: {
  operation: 'profile_generation' | 'demo_content_generation'
  status: 'started' | 'succeeded' | 'failed'
  lead?: string | number
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
      lead: data.lead,
      started_at: data.started_at ?? now,
      finished_at: data.status === 'started' ? undefined : now,
      summary: data.summary,
      error: data.error,
      metadata: data.metadata,
    },
  })
}
