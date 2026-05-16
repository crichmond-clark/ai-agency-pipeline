import type { Payload } from 'payload'

import { type AiProvider, type AiSelection, type AiSelectionInput, type AiTask, isAiProvider } from './ai-provider-options'

type AiSettingsGlobal = {
  default_provider?: string | null
  default_model?: string | null
  per_operation_defaults?: Partial<Record<'profile_provider' | 'profile_model' | 'demo_content_provider' | 'demo_content_model' | 'qa_provider' | 'qa_model' | 'outreach_provider' | 'outreach_model', string | null>> | null
}

const envTaskModel: Record<AiTask, string> = {
  profile: 'AI_PROFILE_MODEL',
  demo_content: 'AI_DEMO_CONTENT_MODEL',
  qa: 'AI_QA_MODEL',
  outreach: 'AI_OUTREACH_MODEL',
}

export async function resolveAiSelection(payload: Payload, task: AiTask, override?: AiSelectionInput): Promise<AiSelection> {
  if (override) return normalizeSelection(override.provider, override.model, 'request_override')

  const settings = await readAiSettings(payload)
  const operationSelection = selectionFromSettings(settings, task)
  if (operationSelection) return operationSelection

  if (isAiProvider(settings.default_provider)) {
    return normalizeSelection(settings.default_provider, settings.default_model ?? undefined, 'settings')
  }

  const envProvider = process.env.AI_PROVIDER
  if (isAiProvider(envProvider)) {
    return normalizeSelection(envProvider, process.env[envTaskModel[task]] ?? process.env.AI_MODEL, 'env')
  }

  return { provider: 'deterministic', source: 'deterministic' }
}

export function aiSelectionMetadata(selection: AiSelection): Record<string, string | undefined> {
  return { ai_provider: selection.provider, ai_model: selection.model, ai_source: selection.source }
}

async function readAiSettings(payload: Payload): Promise<AiSettingsGlobal> {
  try {
    const globalPayload = payload as unknown as { findGlobal(args: { slug: string }): Promise<unknown> }
    return await globalPayload.findGlobal({ slug: 'ai-settings' }) as AiSettingsGlobal
  } catch {
    return {}
  }
}

function selectionFromSettings(settings: AiSettingsGlobal, task: AiTask): AiSelection | undefined {
  const defaults = settings.per_operation_defaults
  if (!defaults) return undefined

  const provider = defaults[`${task}_provider` as keyof typeof defaults]
  const model = defaults[`${task}_model` as keyof typeof defaults]
  if (!provider) return undefined
  if (!isAiProvider(provider)) return undefined
  return normalizeSelection(provider, model ?? undefined, 'settings')
}

function normalizeSelection(provider: AiProvider, model: string | undefined | null, source: AiSelection['source']): AiSelection {
  const trimmedModel = typeof model === 'string' && model.trim() ? model.trim() : undefined
  if (provider === 'deterministic') return { provider, model: trimmedModel, source }
  if (!trimmedModel) throw new Error(`Model is required for provider ${provider}`)
  return { provider, model: trimmedModel, source }
}
