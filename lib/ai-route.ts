import type { Payload } from 'payload'

import { AiSelectionValidationError, validateAiSelection, type AiSelection, type AiTask } from './ai-provider-options'
import { aiSelectionMetadata, resolveAiSelection } from './ai-settings'

export async function resolveAiSelectionForRequest(payload: Payload, request: Request, task: AiTask): Promise<AiSelection | Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  try {
    return await resolveAiSelection(payload, task, validateAiSelection(body))
  } catch (error) {
    if (error instanceof AiSelectionValidationError) {
      return Response.json({ error: error.message, category: error.code }, { status: 400 })
    }
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid AI selection', category: 'validation_failed' }, { status: 400 })
  }
}

export function withAiMetadata(selection: AiSelection, metadata: Record<string, unknown> = {}) {
  return { ...metadata, ...aiSelectionMetadata(selection) }
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response
}
