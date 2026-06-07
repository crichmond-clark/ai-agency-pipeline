import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'
import { z } from 'zod'

const UpdateOutreachSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ outreachMessageId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { outreachMessageId } = await params
  const parsed = UpdateOutreachSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Subject and body are required' }, { status: 400 })

  const current = await payload.findByID({ collection: 'outreach-messages', id: outreachMessageId })
  if (current.status === 'sent' || current.sent_at) return Response.json({ error: 'Sent outreach messages cannot be edited' }, { status: 409 })

  const outreach = await payload.update({ collection: 'outreach-messages', id: outreachMessageId, data: { ...parsed.data, status: 'draft', reviewed_at: null } })
  return Response.json({ outreach_message: outreach })
}
