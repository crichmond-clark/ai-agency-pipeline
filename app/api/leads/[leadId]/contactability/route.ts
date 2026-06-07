import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { doNotContact?: unknown; reason?: unknown } | null
  if (!body || typeof body.doNotContact !== 'boolean') return Response.json({ error: 'doNotContact boolean is required' }, { status: 400 })

  const { leadId } = await params
  const lead = await payload.update({
    collection: 'leads',
    id: leadId,
    data: body.doNotContact
      ? {
        do_not_contact_at: new Date().toISOString(),
        do_not_contact_reason: typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'Blocked from dashboard safety toggle',
      }
      : {
        do_not_contact_at: null,
        do_not_contact_reason: null,
      },
  })

  return Response.json({ lead })
}
