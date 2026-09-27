import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'
import { z } from 'zod'

const schema = z.object({ status: z.enum(['qualified', 'not_fit', 'unreviewed']) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid qualification status' }, { status: 400 })
  const { leadId } = await params
  let lead
  try { lead = await payload.findByID({ collection: 'leads', id: leadId, depth: 0 }) } catch { return Response.json({ error: 'Lead not found' }, { status: 404 }) }
  if (parsed.data.status === 'qualified' && (lead.sales_status === 'lost' || lead.do_not_contact_at || lead.is_sample_lead || !lead.email)) return Response.json({ error: 'Lead is not eligible for qualification' }, { status: 409 })
  const updated = await payload.update({ collection: 'leads', id: lead.id, data: { qualification_status: parsed.data.status }, context: { qualificationOperation: true } })
  return Response.json({ qualification_status: updated.qualification_status })
}
