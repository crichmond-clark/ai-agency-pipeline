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

export const OutreachDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  safety_notes: z.string().min(1),
})

export const DemoThemeSchema = z.object({
  preset: z.enum(['trade_navy_lime', 'heritage_green_gold', 'clean_blue', 'premium_charcoal', 'warm_builder']).optional(),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  surface: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  muted: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  border: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  button_style: z.enum(['square', 'softened', 'pill']).optional(),
  section_density: z.enum(['compact', 'standard', 'spacious']).optional(),
  hero_style: z.enum(['split', 'full_bleed', 'editorial']).optional(),
})

export const DemoContentSchema = z.object({
  schema_version: z.literal(1).optional(),
  variant_key: z.enum(['contractor_classic', 'emergency_first', 'premium_local', 'clean_modern']).optional(),
  theme: DemoThemeSchema.optional(),
  hero: z.object({ eyebrow: z.string(), headline: z.string(), subheadline: z.string(), cta: z.string() }),
  services: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  why_choose_us: z.array(z.string()).min(1),
  service_area: z.string(),
  contact_cta: z.object({ headline: z.string(), body: z.string(), button_label: z.string() }),
  footer_disclaimer: z.string().min(1),
})

export type AiQaReportPayload = z.infer<typeof AiQaReportSchema>
export type BusinessProfilePayload = z.infer<typeof BusinessProfileSchema>
export type DemoThemePayload = z.infer<typeof DemoThemeSchema>
export type DemoContentPayload = z.infer<typeof DemoContentSchema>
export type OutreachDraftPayload = z.infer<typeof OutreachDraftSchema>
