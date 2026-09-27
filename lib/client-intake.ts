import { createHash, randomBytes } from 'node:crypto'

import type { Payload } from 'payload'
import { z } from 'zod'

const httpUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password
  } catch {
    return false
  }
}, 'Enter a valid HTTP or HTTPS URL')

const externalAssetLink = httpUrl.refine((value) => value.length > 0, 'A link is required')

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000),
}).strict()

const claimSchema = z.object({
  claim: z.string().trim().min(1).max(1000),
  source: z.string().trim().max(300),
  permissionConfirmed: z.boolean(),
}).strict()

export const ClientIntakeSubmissionSchema = z.object({
  businessName: z.string().trim().min(1).max(150),
  contactName: z.string().trim().max(150),
  businessNameConfirmed: z.literal(true),
  contactEmail: z.string().trim().email().max(254),
  contactEmailConfirmed: z.literal(true),
  phone: z.string().trim().max(60),
  website: httpUrl,
  address: z.string().trim().max(300),
  city: z.string().trim().max(150),
  businessDescription: z.string().trim().max(5000),
  services: z.array(serviceSchema).min(1).max(20),
  servicesConfirmed: z.literal(true),
  serviceAreas: z.string().trim().max(3000),
  intendedAudience: z.string().trim().max(3000),
  primaryGoal: z.string().trim().min(1).max(3000),
  brandGuidance: z.string().trim().max(5000),
  suppliedCopy: z.string().trim().max(10000),
  claims: z.array(claimSchema).max(20),
  externalAssetLinks: z.array(externalAssetLink).max(10),
  unanswered: z.array(z.string().trim().min(1).max(300)).max(20),
}).strict()

export type ClientIntakeSubmission = z.infer<typeof ClientIntakeSubmissionSchema>

type LeadRecord = {
  id: string | number
  business_name?: string | null
  enquiry_contact_name?: string | null
  email?: string | null
  phone?: string | null
  website_url?: string | null
  address?: string | null
  city?: string | null
  qualification_status?: string | null
  sales_status?: string | null
  do_not_contact_at?: string | null
  is_sample_lead?: boolean | null
}

type ClientIntakeRecord = {
  id: string | number
  lead: string | number | { id: string | number }
  active_lead?: string | number | { id: string | number } | null
  status: string
  token_hash?: string | null
  expires_at: string
}

export type ClientIntakePrefill = {
  businessName: string
  contactName: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  services: Array<{ name: string; description: string }>
}

export type AvailableClientIntake = {
  intakeId: string | number
  leadId: string | number
  prefill: ClientIntakePrefill
}

export function createClientIntakeToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashClientIntakeToken(token: string): string | null {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const decoded = Buffer.from(token, 'base64url')
  if (decoded.byteLength !== 32 || decoded.toString('base64url') !== token) return null
  return createHash('sha256').update(decoded).digest('hex')
}

export function isLeadEligibleForClientIntake(lead: LeadRecord): boolean {
  return lead.qualification_status === 'qualified'
    && lead.sales_status !== 'lost'
    && !lead.do_not_contact_at
    && lead.is_sample_lead !== true
    && typeof lead.email === 'string'
    && z.string().trim().email().safeParse(lead.email).success
}

export async function findAvailableClientIntake(payload: Payload, token: string): Promise<AvailableClientIntake | null> {
  const tokenHash = hashClientIntakeToken(token)
  if (!tokenHash) return null

  const invitations = await payload.find({
    collection: 'client-intakes',
    where: { token_hash: { equals: tokenHash } },
    limit: 1,
    depth: 0,
    select: { id: true, lead: true, status: true, token_hash: true, expires_at: true },
    overrideAccess: true,
  })
  const invitation = invitations.docs[0] as unknown as ClientIntakeRecord | undefined
  const expiresAt = invitation ? Date.parse(invitation.expires_at) : Number.NaN
  if (!invitation || invitation.status !== 'invited' || !invitation.token_hash || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null

  const relatedLead = invitation.lead
  const leadId = typeof relatedLead === 'string' || typeof relatedLead === 'number'
    ? relatedLead
    : typeof relatedLead === 'object' && relatedLead !== null ? relatedLead.id : null
  if (leadId === null) return null
  const lead = await payload.findByID({
    collection: 'leads',
    id: leadId,
    depth: 0,
    select: { id: true, business_name: true, enquiry_contact_name: true, email: true, phone: true, website_url: true, address: true, city: true, qualification_status: true, sales_status: true, do_not_contact_at: true, is_sample_lead: true },
    overrideAccess: true,
  }) as unknown as LeadRecord
  if (!isLeadEligibleForClientIntake(lead)) return null

  const profiles = await payload.find({
    collection: 'business-profiles',
    where: { lead: { equals: leadId } },
    limit: 1,
    depth: 0,
    select: { services: true },
    overrideAccess: true,
  })
  const profile = profiles.docs[0] as unknown as { services?: Array<{ name?: string | null }> } | undefined
  const services = Array.isArray(profile?.services)
    ? profile.services.flatMap((service) => typeof service?.name === 'string' && service.name.trim() ? [{ name: service.name.trim(), description: '' }] : [])
    : []

  return {
    intakeId: invitation.id,
    leadId,
    prefill: {
      businessName: lead.business_name ?? '',
      contactName: lead.enquiry_contact_name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      website: lead.website_url ?? '',
      address: lead.address ?? '',
      city: lead.city ?? '',
      services,
    },
  }
}

export function getClientIntakeFieldStatus(value: string, sourceValue: string): 'confirmed' | 'corrected' | 'provided' {
  const normalizedValue = value.trim()
  const normalizedSource = sourceValue.trim()
  if (!normalizedSource) return 'provided'
  return normalizedValue === normalizedSource ? 'confirmed' : 'corrected'
}

export function buildStoredClientIntakeAnswers(submission: ClientIntakeSubmission, prefill: ClientIntakePrefill, submittedAt: string) {
  const profileServiceNames = prefill.services.map(({ name }) => name.trim().toLowerCase()).filter(Boolean)
  const submittedServiceNames = submission.services.map(({ name }) => name.trim().toLowerCase())
  const serviceStatus = profileServiceNames.length === 0
    ? 'provided'
    : profileServiceNames.join('\n') === submittedServiceNames.join('\n') ? 'confirmed' : 'corrected'
  const fieldStatus = {
    business_name: getClientIntakeFieldStatus(submission.businessName, prefill.businessName),
    contact_name: getClientIntakeFieldStatus(submission.contactName, prefill.contactName),
    contact_email: getClientIntakeFieldStatus(submission.contactEmail, prefill.email),
    phone: getClientIntakeFieldStatus(submission.phone, prefill.phone),
    website: getClientIntakeFieldStatus(submission.website, prefill.website),
    address: getClientIntakeFieldStatus(submission.address, prefill.address),
    city: getClientIntakeFieldStatus(submission.city, prefill.city),
    services: serviceStatus,
    claims: 'pending_owner_review',
  }
  const missingSections: string[] = []
  if (!submission.phone) missingSections.push('phone')
  if (!submission.website) missingSections.push('website')
  if (!submission.address) missingSections.push('address')
  if (!submission.city) missingSections.push('city')
  if (!submission.businessDescription) missingSections.push('business_description')
  if (!submission.serviceAreas) missingSections.push('service_areas')
  if (!submission.intendedAudience) missingSections.push('intended_audience')
  if (!submission.brandGuidance) missingSections.push('brand_guidance')
  if (!submission.suppliedCopy) missingSections.push('supplied_copy')
  if (!submission.claims.length) missingSections.push('claims')
  if (!submission.externalAssetLinks.length) missingSections.push('external_asset_links')
  const answers = {
    source: 'client_submitted',
    submitted_at: submittedAt,
    prefill_snapshot: {
      business_name: prefill.businessName,
      contact_name: prefill.contactName,
      contact_email: prefill.email,
      phone: prefill.phone,
      website: prefill.website,
      address: prefill.address,
      city: prefill.city,
      services: prefill.services,
    },
    business_name: submission.businessName,
    contact_name: submission.contactName,
    contact_email: submission.contactEmail,
    phone: submission.phone,
    website: submission.website,
    address: submission.address,
    city: submission.city,
    business_description: submission.businessDescription,
    services: submission.services,
    service_areas: submission.serviceAreas,
    intended_audience: submission.intendedAudience,
    primary_goal: submission.primaryGoal,
    brand_guidance: submission.brandGuidance,
    supplied_copy: submission.suppliedCopy,
    claims: submission.claims.map((claim) => ({ ...claim, status: 'pending_owner_review' })),
    external_asset_links: submission.externalAssetLinks,
    unanswered: submission.unanswered,
    missing_sections: [...missingSections, ...submission.unanswered],
    field_status: fieldStatus,
  }
  return {
    answers,
    verificationFlags: {
      ...fieldStatus,
      business_name_confirmed: submission.businessNameConfirmed,
      contact_email_confirmed: submission.contactEmailConfirmed,
      services_confirmed: submission.servicesConfirmed,
    },
  }
}
