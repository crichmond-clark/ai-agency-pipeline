import { z } from 'zod'

export const BusinessProfileSchema = z.object({
  industry: z.string().min(1),
  services: z.array(z.object({ name: z.string().min(1) })).default([]),
  verified_facts: z.array(z.object({ fact: z.string().min(1), source: z.string().optional() })).default([]),
  assumptions: z.array(z.object({ assumption: z.string().min(1) })).default([]),
  confidence: z.number().min(0).max(1),
  missing_information: z.array(z.object({ item: z.string().min(1) })).default([]),
  raw_profile: z.record(z.string(), z.unknown()).optional(),
})

export const AiQaReportSchema = z.object({
  status: z.enum(['passed', 'failed']),
  findings: z.array(z.object({ severity: z.enum(['info', 'warning', 'error']), message: z.string().min(1) })).default([]),
  summary: z.string().min(1),
})

export const DemoContentSchema = z.object({
  hero: z.object({ eyebrow: z.string(), headline: z.string(), subheadline: z.string(), cta: z.string() }),
  services: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  why_choose_us: z.array(z.string()).min(1),
  service_area: z.string(),
  contact_cta: z.object({ headline: z.string(), body: z.string(), button_label: z.string() }),
  footer_disclaimer: z.string().min(1),
})

export type AiQaReportPayload = z.infer<typeof AiQaReportSchema>
export type BusinessProfilePayload = z.infer<typeof BusinessProfileSchema>
export type DemoContentPayload = z.infer<typeof DemoContentSchema>
