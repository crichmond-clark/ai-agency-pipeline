import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import { z } from 'zod'

const enquirySchema = z.object({
  submissionId: z.number().int().positive(),
  businessName: z.string().trim().min(1).max(150),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(80).optional(),
  existingWebsite: z.string().trim().url().max(2048).refine((value) => { const protocol = new URL(value).protocol; return protocol === 'http:' || protocol === 'https:' }, 'Website must use http or https').optional(),
  need: z.enum(['new_website', 'replace_existing', 'ecommerce', 'content_website', 'not_sure']).optional(),
  goal: z.enum(['more_enquiries', 'more_calls', 'sell_online', 'credibility', 'replace_outdated', 'other']).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
}).strict()

export type WebsiteEnquiry = z.infer<typeof enquirySchema>

export async function ingestWebsiteEnquiry(payload: Payload, raw: unknown) {
  const enquiry = enquirySchema.parse(raw)
  const immutable = Object.fromEntries(Object.entries(enquiry).filter(([key]) => key !== 'submissionId'))
  const hash = createHash('sha256').update(JSON.stringify(immutable)).digest('hex')
  const existing = await payload.find({ collection: 'leads', where: { website_submission_id: { equals: enquiry.submissionId } }, limit: 1, overrideAccess: true })
  if (existing.docs[0]) {
    if (existing.docs[0].website_submission_hash !== hash) throw new Error('submission_conflict')
    const replayLeadId = Number(existing.docs[0].id)
    await ensureWebsiteEnquiryRun(payload, replayLeadId)
    return { leadId: replayLeadId, created: false }
  }
  let leadId: number
  try {
    const lead = await payload.create({
      collection: 'leads',
      overrideAccess: true,
      context: { websiteEnquiryIngestion: true },
      data: {
        business_name: enquiry.businessName,
        email: enquiry.email,
        phone: enquiry.phone,
        website_url: enquiry.existingWebsite,
        website_status: enquiry.existingWebsite ? 'live' : 'unknown',
        lead_source: 'askeladd-website',
        pipeline_status: 'new',
        sales_status: 'not_contacted',
        website_submission_id: enquiry.submissionId,
        website_submission_hash: hash,
        enquiry_contact_name: enquiry.name,
        enquiry_subject: enquiry.subject,
        enquiry_message: enquiry.message,
        enquiry_need: enquiry.need,
        enquiry_goal: enquiry.goal,
        qualification_status: 'unreviewed',
      },
    })
    leadId = lead.id
  } catch (error) {
    const replay = await payload.find({ collection: 'leads', where: { website_submission_id: { equals: enquiry.submissionId } }, limit: 1, overrideAccess: true })
    if (!replay.docs[0]) throw error
    if (replay.docs[0].website_submission_hash !== hash) throw new Error('submission_conflict')
    const replayLeadId = Number(replay.docs[0].id)
    await ensureWebsiteEnquiryRun(payload, replayLeadId)
    return { leadId: replayLeadId, created: false }
  }
  await ensureWebsiteEnquiryRun(payload, leadId)
  return { leadId, created: true }
}

async function ensureWebsiteEnquiryRun(payload: Payload, leadId: number): Promise<void> {
  const idempotencyKey = `website-enquiry-ingestion:${leadId}`
  const findRun = () => payload.find({
    collection: 'workflow-runs',
    where: { idempotency_key: { equals: idempotencyKey } },
    limit: 1,
    overrideAccess: true,
  })
  if ((await findRun()).docs[0]) return
  const now = new Date().toISOString()
  try {
    await payload.create({
      collection: 'workflow-runs',
      overrideAccess: true,
      data: { idempotency_key: idempotencyKey, operation: 'website_enquiry_ingestion', status: 'succeeded', lead: leadId, started_at: now, finished_at: now, summary: 'Website enquiry lead created' },
    })
  } catch (error) {
    if ((await findRun()).docs[0]) return
    throw error
  }
}
