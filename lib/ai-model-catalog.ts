import type { Payload } from 'payload'

import { curatedModelSuggestions, type AiProvider } from './ai-provider-options'
import { postAiServiceJson } from './ai-service-client'

type CatalogResponse = {
  provider: AiProvider
  models: string[]
  warning?: string
}

type AiSettingsCache = {
  provider_model_cache?: Partial<Record<AiProvider, string[]>> | null
}

export async function refreshProviderModelCatalog(payload: Payload, provider: AiProvider): Promise<CatalogResponse> {
  const response = await postAiServiceJson('/models/refresh', { provider }) as CatalogResponse
  const globalPayload = payload as unknown as { findGlobal(args: { slug: string }): Promise<unknown>; updateGlobal(args: { slug: string; data: Record<string, unknown> }): Promise<unknown> }
  const existing = await globalPayload.findGlobal({ slug: 'ai-settings' }) as AiSettingsCache
  const provider_model_cache = { ...(existing.provider_model_cache ?? {}), [provider]: response.models }
  await globalPayload.updateGlobal({ slug: 'ai-settings', data: { provider_model_cache, provider_model_cache_refreshed_at: new Date().toISOString() } })
  return response
}

export function modelSuggestions(provider: AiProvider, cache: Partial<Record<AiProvider, string[]>> | null | undefined): string[] {
  return Array.from(new Set([...(cache?.[provider] ?? []), ...curatedModelSuggestions[provider]]))
}
