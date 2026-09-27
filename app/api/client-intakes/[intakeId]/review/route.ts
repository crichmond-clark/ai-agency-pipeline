import { sql } from '@payloadcms/db-postgres'
import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'
import { z } from 'zod'

import { recordWorkflowRun } from '@/lib/workflow'

const decisionsSchema = z.record(z.string().regex(/^(business_name|contact_name|contact_email|phone|website|address|city|business_description|services|service_areas|intended_audience|primary_goal|brand_guidance|supplied_copy|claims(?:\.\d+)?|external_asset_links|unanswered)$/), z.enum(['accepted', 'rejected'])).refine((value) => Object.keys(value).length > 0 && Object.keys(value).length <= 100)
const bodySchema = z.object({ decisions: decisionsSchema, finalize: z.boolean().optional() }).strict()

export async function POST(request: Request, { params }: { params: Promise<{ intakeId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid review decisions' }, { status: 400 })
  const { intakeId } = await params
  let intake
  try { intake = await payload.findByID({ collection: 'client-intakes', id: intakeId, depth: 0 }) } catch { return Response.json({ error: 'Intake not found' }, { status: 404 }) }
  if (intake.status !== 'submitted' && intake.status !== 'reviewed') return Response.json({ error: 'Only submitted intakes can be reviewed' }, { status: 409 })
  const answers = record(intake.answers)
  const acceptedFacts = record(intake.accepted_facts)
  const claims = Array.isArray(answers.claims) ? [...answers.claims] : []
  const reviewDecisions = record(intake.review_decisions)
  const reviewerId = auth.user.id
  const reviewedAt = new Date().toISOString()
  for (const [path, decision] of Object.entries(parsed.data.decisions)) {
    let value: unknown
    if (path.startsWith('claims.')) {
      const index = Number(path.slice('claims.'.length))
      if (!Number.isInteger(index) || !claims[index]) return Response.json({ error: 'Unknown intake answer' }, { status: 400 })
      claims[index] = { ...record(claims[index]), status: decision }
      value = claims[index]
    } else {
      if (!(path in answers)) return Response.json({ error: 'Unknown intake answer' }, { status: 400 })
      value = answers[path]
    }
    reviewDecisions[path] = { decision, reviewer: reviewerId, reviewed_at: reviewedAt }
    if (decision === 'accepted' && isEmptyAnswer(value)) return Response.json({ error: 'Empty answers cannot be accepted as verified facts' }, { status: 400 })
    if (decision === 'accepted') acceptedFacts[path] = { value, source: 'client_submitted', reviewer: reviewerId, reviewed_at: reviewedAt }
    else delete acceptedFacts[path]
  }
  answers.claims = claims
  const requiredReviewPaths = ['business_name', 'contact_name', 'contact_email', 'phone', 'website', 'address', 'city', 'business_description', 'services', 'service_areas', 'intended_audience', 'primary_goal', 'brand_guidance', 'supplied_copy', 'external_asset_links', 'unanswered']
    .filter((key) => key in answers)
    .concat(claims.map((_, index) => `claims.${index}`))
  if (parsed.data.finalize && requiredReviewPaths.some((path) => !(path in reviewDecisions))) return Response.json({ error: 'Review every submitted section before completing review' }, { status: 409 })
  const updated = await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`UPDATE "client_intakes"
      SET "answers" = ${JSON.stringify(answers)}::jsonb,
          "accepted_facts" = ${JSON.stringify(acceptedFacts)}::jsonb,
          "review_decisions" = ${JSON.stringify(reviewDecisions)}::jsonb,
          "status" = CASE WHEN ${Boolean(parsed.data.finalize)} THEN 'reviewed' ELSE "status" END,
          "reviewed_at" = CASE WHEN ${Boolean(parsed.data.finalize)} THEN ${reviewedAt} ELSE "reviewed_at" END,
          "updated_at" = GREATEST(${reviewedAt}::timestamptz, "updated_at" + interval '1 millisecond')
      WHERE "id" = ${intake.id} AND "updated_at" = ${intake.updatedAt}
      RETURNING "status", "accepted_facts"`,
  })
  if (!('rows' in updated) || !updated.rows || updated.rows.length !== 1) return Response.json({ error: 'Intake changed during review; reload and retry' }, { status: 409 })
  const updatedIntake = updated.rows[0]
  await recordWorkflowRun(payload, { operation: 'client_intake_review', status: 'succeeded', lead: typeof intake.lead === 'number' ? intake.lead : undefined, summary: 'Client intake facts reviewed by owner' }).catch(() => undefined)
  return Response.json({ status: updatedIntake.status, accepted_facts: updatedIntake.accepted_facts })
}

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {} }
function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
