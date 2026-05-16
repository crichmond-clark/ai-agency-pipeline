import { AiQaReportSchema, BusinessProfileSchema, DemoContentSchema, type AiQaReportPayload, type BusinessProfilePayload, type DemoContentPayload } from '@/types/ai'

export type LeadInput = {
  business_name?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  website_url?: string
  website_status?: string
  source_payload?: unknown
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'

export async function requestBusinessProfile(lead: LeadInput): Promise<BusinessProfilePayload> {
  const response = await postJson('/profile', { lead })
  return BusinessProfileSchema.parse(response)
}

export async function requestDemoContent(input: { lead: LeadInput; profile: BusinessProfilePayload }): Promise<DemoContentPayload> {
  const response = await postJson('/demo-content', input)
  return DemoContentSchema.parse(response)
}

export async function requestAiQa(input: { demo_url: string; content: DemoContentPayload }): Promise<AiQaReportPayload> {
  const response = await postJson('/qa', input)
  return AiQaReportSchema.parse(response)
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`AI Service request failed: ${path} returned ${response.status}`)
  }

  return response.json()
}
