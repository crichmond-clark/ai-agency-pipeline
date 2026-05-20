import { AiQaReportSchema, BusinessProfileSchema, DemoContentSchema, OutreachDraftSchema, type AiQaReportPayload, type BusinessProfilePayload, type DemoContentPayload, type OutreachDraftPayload } from '@/types/ai'
import type { AiSelection } from '@/lib/ai-provider-options'
import { requiredEnv } from '@/lib/env'

export type LeadInput = {
  business_name?: string
  city?: string | null
  address?: string
  phone?: string
  email?: string
  website_url?: string
  website_status?: string
  source_payload?: unknown
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'

export class AiServiceError extends Error {
  constructor(public category: string, message: string, public status: number) {
    super(message)
  }
}

export async function requestBusinessProfile(lead: LeadInput, aiConfig?: AiSelection): Promise<BusinessProfilePayload> {
  const response = await postAiServiceJson('/profile', { lead, ai_config: toAiConfig(aiConfig) })
  return BusinessProfileSchema.parse(response)
}

export async function requestDemoContent(input: { lead: LeadInput; profile: BusinessProfilePayload }, aiConfig?: AiSelection): Promise<DemoContentPayload> {
  const response = await postAiServiceJson('/demo-content', { ...input, ai_config: toAiConfig(aiConfig) })
  return DemoContentSchema.parse(response)
}

export async function requestAiQa(input: { demo_url: string; content: DemoContentPayload }, aiConfig?: AiSelection): Promise<AiQaReportPayload> {
  const response = await postAiServiceJson('/qa', { ...input, ai_config: toAiConfig(aiConfig) })
  return AiQaReportSchema.parse(response)
}

export async function requestOutreachDraft(input: { lead: LeadInput; demo_url: string }, aiConfig?: AiSelection): Promise<OutreachDraftPayload> {
  const response = await postAiServiceJson('/outreach-draft', { ...input, ai_config: toAiConfig(aiConfig) })
  return OutreachDraftSchema.parse(response)
}

export async function postAiServiceJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${requiredEnv('AI_SERVICE_TOKEN')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await safeJson(response)
    const category = typeof errorBody?.category === 'string' ? errorBody.category : 'provider_request_failed'
    const message = typeof errorBody?.message === 'string' ? errorBody.message : `AI Service request failed: ${path} returned ${response.status}`
    throw new AiServiceError(category, message, response.status)
  }

  return response.json()
}

function toAiConfig(selection: AiSelection | undefined) {
  if (!selection) return undefined
  return { provider: selection.provider, model: selection.model }
}

async function safeJson(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}
