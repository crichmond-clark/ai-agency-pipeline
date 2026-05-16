import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const lead = await payload.update({
    collection: 'leads',
    id: leadId,
    data: {
      demo_creation_approved_at: new Date().toISOString(),
      demo_creation_approved_by: auth.user.id,
    },
  })

  return Response.json({ lead })
}
