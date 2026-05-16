import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

export async function POST(request: Request, { params }: { params: Promise<{ outreachMessageId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { outreachMessageId } = await params
  const outreach = await payload.update({ collection: 'outreach-messages', id: outreachMessageId, data: { status: 'reviewed', reviewed_at: new Date().toISOString() } })
  return Response.json({ outreach_message: outreach })
}
