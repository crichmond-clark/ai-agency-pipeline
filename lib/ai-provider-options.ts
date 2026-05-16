export const aiProviders = ['deterministic', 'opencode-go', 'zai', 'openrouter', 'openai', 'openai-compatible'] as const

export type AiProvider = (typeof aiProviders)[number]
export type AiTask = 'profile' | 'demo_content' | 'qa' | 'outreach'

export type AiSelection = {
  provider: AiProvider
  model?: string
  source: 'request_override' | 'settings' | 'env' | 'deterministic'
}

export type AiSelectionInput = {
  provider: AiProvider
  model?: string
}

export const providerOptions = aiProviders.map((provider) => ({ label: provider, value: provider }))

export const curatedModelSuggestions: Record<AiProvider, string[]> = {
  deterministic: [],
  'opencode-go': ['glm-5.1', 'glm-5', 'deepseek-v4-flash', 'deepseek-v4-pro'],
  zai: ['glm-4.7', 'glm-4.5-air', 'glm-5.1'],
  openrouter: ['z-ai/glm-4.5', 'anthropic/claude-sonnet-4.5', 'openai/gpt-4.1-mini'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  'openai-compatible': ['gpt-4.1-mini'],
}

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && aiProviders.includes(value as AiProvider)
}

export function validateAiSelection(input: unknown): AiSelectionInput | undefined {
  if (!input || typeof input !== 'object' || !('ai' in input)) return undefined
  const ai = (input as { ai?: unknown }).ai
  if (!ai || typeof ai !== 'object') return undefined

  const provider = (ai as { provider?: unknown }).provider
  const model = (ai as { model?: unknown }).model
  if (!isAiProvider(provider)) throw new AiSelectionValidationError('unknown_provider', 'Unknown AI provider')
  if (provider !== 'deterministic' && (typeof model !== 'string' || !model.trim())) {
    throw new AiSelectionValidationError('missing_model', 'Model is required for non-deterministic providers')
  }

  return { provider, model: typeof model === 'string' ? model.trim() : undefined }
}

export class AiSelectionValidationError extends Error {
  constructor(public code: 'unknown_provider' | 'missing_model', message: string) {
    super(message)
  }
}
