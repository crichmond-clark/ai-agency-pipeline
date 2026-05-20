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
  checks.push({ name: 'no_fake_reviews', passed: !JSON.stringify(content ?? {}).toLowerCase().includes('testimonial'), details: 'Structured content should not include testimonials or reviews.' })

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
