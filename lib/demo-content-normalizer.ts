import type { HomeServicesVariant, NormalizedHomeServicesContent } from '@/components/demo-renderer/types'
import type { DemoContentPayload } from '@/types/ai'

const internalCopyPatterns = [
  /\bconcepts?\b/i,
  /\bmockups?\b/i,
  /\bdemos?\b/i,
  /\btemplates?\b/i,
  /\bgenerated\b/i,
  /\blayouts?\b/i,
  /\bwebsites?\b/i,
  /\bhomepages?\b/i,
  /\bpages?\b/i,
  /\bonline home\b/i,
  /\blead data\b/i,
  /\bbusiness profile\b/i,
  /\bservice information\b/i,
  /\bcontact prompts?\b/i,
  /\bservice-area messaging\b/i,
]

const fallbackProcessSteps = [
  { title: 'Call or send an enquiry', body: 'Start with the job, property, or problem that needs attention.' },
  { title: 'Talk through the details', body: 'Share the service needed, location, timing, and any useful context.' },
  { title: 'Agree the next step', body: 'Use the contact details to arrange a quote, visit, or follow-up conversation.' },
]

const fallbackTrustReasons = [
  'Straightforward contact details for local enquiries',
  'Clear service areas and practical next steps',
  'A simple way to discuss the job before booking',
]

type NormalizeInput = {
  businessName: string
  city?: string
  phone?: string
  email?: string
  content: DemoContentPayload
}

export function normalizeHomeServicesContent({ businessName, city, phone, email, content }: NormalizeInput): NormalizedHomeServicesContent {
  const fallbackArea = city ? `Serving ${city} and nearby areas.` : 'Serving the local area.'
  const serviceArea = safeText(content.service_area, fallbackArea)
  const contactBody = safeText(content.contact_cta.body, 'Call or send an enquiry with the service needed, location, and any useful details.')
  const variant = toHomeServicesVariant(content.variant_key)

  return {
    variant,
    themeInput: content.theme,
    businessName,
    city,
    phone,
    email,
    contactHref: phone ? `tel:${phone}` : '#contact',
    secondaryContactHref: email ? `mailto:${email}` : '#contact',
    serviceArea,
    serviceAreaLabel: city ? `Serving ${city} and nearby areas` : serviceArea,
    hero: {
      eyebrow: safeText(content.hero.eyebrow, 'Local home services'),
      headline: safeText(content.hero.headline, city ? `Reliable local help in ${city}` : `Reliable local help from ${businessName}`),
      subheadline: safeText(content.hero.subheadline, `Contact ${businessName} to talk through the service needed, property details, and next steps.`),
      primaryCta: safeText(content.hero.cta, 'Request a quote'),
      secondaryCta: safeText(content.contact_cta.button_label, 'Send enquiry'),
    },
    services: content.services.map((service) => toDisplayService(service, city)),
    trustReasons: toDisplayReasons(content.why_choose_us),
    processSteps: fallbackProcessSteps,
    contactCta: {
      headline: safeText(content.contact_cta.headline, 'Need help with a local job?'),
      body: contactBody,
      buttonLabel: safeText(content.contact_cta.button_label, 'Send enquiry'),
    },
    footerDisclaimer: content.footer_disclaimer,
  }
}

export function safeDemoText(value: string, fallback: string): string {
  return safeText(value, fallback)
}

function toDisplayService(service: DemoContentPayload['services'][number], city: string | undefined) {
  const serviceTitle = safeText(service.title, 'Local services')
  const fallbackDescription = city
    ? `Talk through ${serviceTitle.toLowerCase()} needs and next steps for properties in ${city}.`
    : `Talk through ${serviceTitle.toLowerCase()} needs, property details, and next steps.`
  return {
    title: serviceTitle,
    description: safeText(service.description, fallbackDescription),
  }
}

function toDisplayReasons(reasons: string[]): string[] {
  const safeReasons = reasons.map((reason) => safeText(reason, '')).filter(Boolean)
  return safeReasons.length ? safeReasons : fallbackTrustReasons
}

function toHomeServicesVariant(value: string | undefined): HomeServicesVariant {
  if (value === 'emergency_first' || value === 'premium_local' || value === 'clean_modern') return value
  return 'contractor_classic'
}

function safeText(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (!trimmed || internalCopyPatterns.some((pattern) => pattern.test(trimmed))) return fallback
  return trimmed
}
