import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { isAiProvider } from '@/lib/ai-provider-options'
import { refreshProviderModelCatalog } from '@/lib/ai-model-catalog'
import { AiServiceError } from '@/lib/ai-service-client'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => undefined)
  const provider = typeof body === 'object' && body ? (body as { provider?: unknown }).provider : undefined
  if (!isAiProvider(provider)) return Response.json({ error: 'Unknown AI provider', category: 'unknown_provider' }, { status: 400 })

  try {
    const result = await refreshProviderModelCatalog(payload, provider)
    return Response.json(result)
  } catch (error) {
    const category = error instanceof AiServiceError ? error.category : 'provider_request_failed'
    const message = error instanceof Error ? error.message : 'Model catalog refresh failed'
    return Response.json({ error: message, category }, { status: 400 })
  }
}
