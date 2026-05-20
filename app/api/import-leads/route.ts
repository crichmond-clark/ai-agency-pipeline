import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { parseCsv } from '@/lib/csv'
import { importBusinessFinderRows } from '@/lib/leads'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = parseCsv(await request.text())
  const startedAt = new Date().toISOString()

  try {
    const result = await importBusinessFinderRows(payload, rows)
    await payload.create({
      collection: 'workflow-runs',
      data: { operation: 'csv_import', status: 'succeeded', started_at: startedAt, finished_at: new Date().toISOString(), summary: `Created ${result.created}, updated ${result.updated}` },
    })
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown import error'
    await payload.create({
      collection: 'workflow-runs',
      data: { operation: 'csv_import', status: 'failed', started_at: startedAt, finished_at: new Date().toISOString(), error: message },
    })
    return Response.json({ error: message }, { status: 400 })
  }
}
