import { DemoContentSchema, type DemoContentPayload } from '@/types/ai'

type DemoSiteForQa = {
  slug?: string
  content?: unknown
  is_public?: boolean | null
}

type QaCheck = {
  name: string
  passed: boolean
  details: string
}

export type QaReport = {
  status: 'passed' | 'failed'
  deterministic: QaCheck[]
  ai?: unknown
  checked_at: string
}

export function runDeterministicQa(input: unknown): QaReport {
  const demoSite = toDemoSiteForQa(input)
  let content: DemoContentPayload | null = null
  const checks: QaCheck[] = []

  const parsed = DemoContentSchema.safeParse(demoSite.content)
  content = parsed.success ? parsed.data : null

  checks.push({ name: 'content_schema_valid', passed: parsed.success, details: parsed.success ? 'Content matches DemoContentSchema.' : parsed.error?.message ?? 'Invalid content.' })
  checks.push({ name: 'public_slug_present', passed: Boolean(demoSite.slug), details: demoSite.slug ? `Slug: ${demoSite.slug}` : 'Missing slug.' })
  checks.push({ name: 'demo_is_public', passed: demoSite.is_public === true, details: demoSite.is_public ? 'Demo is public.' : 'Demo is not public.' })
  checks.push({ name: 'footer_disclaimer_present', passed: Boolean(content?.footer_disclaimer.toLowerCase().includes('unofficial') && content.footer_disclaimer.toLowerCase().includes('demonstration')), details: content?.footer_disclaimer ?? 'Missing disclaimer.' })
  checks.push({ name: 'no_fake_reviews', passed: !bodyContentIncludes(content, ['testimonial', 'review']), details: 'Structured content should not include testimonials or reviews.' })
  checks.push({ name: 'no_meta_demo_copy', passed: !bodyContentIncludes(content, ['concept', 'mockup', 'demo', 'template', 'generated', 'layout', 'website', 'homepage', 'page', 'online home', 'lead data', 'business profile', 'service information', 'contact prompt', 'service-area messaging']), details: 'Customer-facing content should not describe the page as a demo, mockup, template, generated asset, layout, website, or internal workflow artifact.' })

  return {
    status: checks.every((check) => check.passed) ? 'passed' : 'failed',
    deterministic: checks,
    checked_at: new Date().toISOString(),
  }
}

function toDemoSiteForQa(input: unknown): DemoSiteForQa {
  if (!input || typeof input !== 'object') return {}
  const demoSite = input as DemoSiteForQa
  return {
    slug: demoSite.slug,
    content: demoSite.content,
    is_public: demoSite.is_public,
  }
}

function bodyContentIncludes(content: DemoContentPayload | null, blockedTerms: string[]): boolean {
  if (!content) return false
  const bodyContent = {
    hero: content.hero,
    services: content.services,
    why_choose_us: content.why_choose_us,
    service_area: content.service_area,
    contact_cta: content.contact_cta,
  }
  const serialized = JSON.stringify(bodyContent).toLowerCase()
  return blockedTerms.some((term) => new RegExp(`\\b${escapeRegExp(term)}s?\\b`).test(serialized))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
