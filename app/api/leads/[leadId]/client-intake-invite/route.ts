import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'
import { z } from 'zod'

import { readBoundedJson, BoundedJsonError } from '@/lib/bounded-json'
import { createClientIntakeToken, hashClientIntakeToken, isLeadEligibleForClientIntake } from '@/lib/client-intake'
import { sendClientIntakeInvitation } from '@/lib/resend'
import { recordWorkflowRun } from '@/lib/workflow'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
}
const confirmationSchema = z.object({ confirmSend: z.literal(true) }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS })

  let body: unknown
  try {
    body = await readBoundedJson(request, 1024)
  } catch (error) {
    const status = error instanceof BoundedJsonError ? error.status : 400
    return Response.json({ error: 'Invalid invitation request' }, { status, headers: PRIVATE_HEADERS })
  }
  if (!confirmationSchema.safeParse(body).success) {
    return Response.json({ error: 'Explicit send confirmation is required' }, { status: 400, headers: PRIVATE_HEADERS })
  }

  const { leadId } = await params
  let lead
  try {
    lead = await payload.findByID({ collection: 'leads', id: leadId, depth: 0, overrideAccess: true })
  } catch {
    return Response.json({ error: 'Lead is not eligible for an intake invitation' }, { status: 404, headers: PRIVATE_HEADERS })
  }
  if (!isLeadEligibleForClientIntake(lead)) {
    return Response.json({ error: 'Lead is not eligible for an intake invitation' }, { status: 409, headers: PRIVATE_HEADERS })
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL
  let baseUrl: URL
  try {
    if (!configuredBaseUrl) throw new Error('Missing application URL')
    baseUrl = new URL(configuredBaseUrl)
    if ((baseUrl.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && baseUrl.protocol === 'http:')) || baseUrl.username || baseUrl.password) throw new Error('Invalid application URL')
  } catch {
    return Response.json({ error: 'Client intake invitation URL is not configured' }, { status: 500, headers: PRIVATE_HEADERS })
  }

  const startedAt = new Date().toISOString()
  try {
    const activeInvitations = await payload.find({
      collection: 'client-intakes',
      where: { and: [{ active_lead: { equals: lead.id } }, { status: { equals: 'invited' } }] },
      limit: 2,
      depth: 0,
      overrideAccess: true,
    })
    for (const prior of activeInvitations.docs) {
      await payload.update({
        collection: 'client-intakes',
        where: { and: [{ id: { equals: prior.id } }, { active_lead: { equals: lead.id } }, { status: { equals: 'invited' } }] },
        data: { status: 'revoked', active_lead: null },
        overrideAccess: true,
        context: { clientIntakeOperation: 'revoke' },
      })
    }

    const latestLead = await payload.findByID({ collection: 'leads', id: lead.id, depth: 0, overrideAccess: true })
    if (!isLeadEligibleForClientIntake(latestLead) || typeof latestLead.email !== 'string' || typeof latestLead.business_name !== 'string') {
      return Response.json({ error: 'Lead is not eligible for an intake invitation' }, { status: 409, headers: PRIVATE_HEADERS })
    }

    const token = createClientIntakeToken()
    const tokenHash = hashClientIntakeToken(token)
    if (!tokenHash) throw new Error('Generated token was invalid')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const invitation = await payload.create({
      collection: 'client-intakes',
      data: {
        lead: lead.id,
        active_lead: lead.id,
        status: 'invited',
        delivery_status: 'unsent',
        token_hash: tokenHash,
        expires_at: expiresAt,
        invited_by: auth.user.id,
      },
      overrideAccess: true,
      context: { clientIntakeOperation: 'invite' },
    })
    const intakeUrl = new URL(`/intake/${token}`, baseUrl).toString()

    let deliveryStatus: 'sent' | 'failed'
    try {
      await sendClientIntakeInvitation({
        to: latestLead.email.trim(),
        businessName: latestLead.business_name,
        url: intakeUrl,
        idempotencyKey: `client-intake-invite-${invitation.id}`,
      })
      deliveryStatus = 'sent'
    } catch {
      deliveryStatus = 'failed'
    }

    await payload.update({
      collection: 'client-intakes',
      id: invitation.id,
      data: { delivery_status: deliveryStatus },
      overrideAccess: true,
      context: { clientIntakeOperation: 'delivery' },
    })
    await recordWorkflowRun(payload, {
      operation: 'client_intake_invitation',
      status: deliveryStatus === 'sent' ? 'succeeded' : 'failed',
      lead: lead.id,
      started_at: startedAt,
      summary: deliveryStatus === 'sent' ? 'Client intake invitation sent' : 'Client intake invitation delivery failed',
      error: deliveryStatus === 'failed' ? 'Transactional invitation delivery failed' : undefined,
    })

    return Response.json({ url: intakeUrl, expires_at: expiresAt, delivery_status: deliveryStatus }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    if (error && typeof error === 'object' && 'data' in error) {
      return Response.json({ error: 'An active intake invitation could not be issued' }, { status: 409, headers: PRIVATE_HEADERS })
    }
    await recordWorkflowRun(payload, {
      operation: 'client_intake_invitation',
      status: 'failed',
      lead: lead.id,
      started_at: startedAt,
      summary: 'Client intake invitation could not be issued',
      error: 'Invitation operation failed',
    }).catch(() => undefined)
    return Response.json({ error: 'Client intake invitation could not be issued' }, { status: 500, headers: PRIVATE_HEADERS })
  }
}
