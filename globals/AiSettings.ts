import type { GlobalConfig } from 'payload'

import { providerOptions } from '../lib/ai-provider-options'

export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'AI Settings',
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'default_provider', type: 'select', options: providerOptions, defaultValue: 'deterministic', required: true },
    { name: 'default_model', type: 'text', admin: { description: 'Required unless the provider is deterministic.' } },
    {
      name: 'per_operation_defaults',
      type: 'group',
      admin: { description: 'Advanced overrides. Leave provider blank to use the global default.' },
      fields: [
        { name: 'profile_provider', type: 'select', options: providerOptions },
        { name: 'profile_model', type: 'text' },
        { name: 'demo_content_provider', type: 'select', options: providerOptions },
        { name: 'demo_content_model', type: 'text' },
        { name: 'qa_provider', type: 'select', options: providerOptions },
        { name: 'qa_model', type: 'text' },
        { name: 'outreach_provider', type: 'select', options: providerOptions },
        { name: 'outreach_model', type: 'text' },
      ],
    },
    { name: 'openai_compatible_base_url_label', type: 'text', admin: { description: 'Non-secret label only. The actual base URL stays in AI_BASE_URL.' } },
    { name: 'provider_model_cache', type: 'json', admin: { description: 'Non-secret cached model IDs returned by provider catalog refresh.' } },
    { name: 'provider_model_cache_refreshed_at', type: 'date', admin: { readOnly: true } },
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      const errors = validateSettings(data)
      if (errors.length) throw new Error(errors.join('; '))
      return data
    }],
  },
}

function validateSettings(data: Record<string, unknown> | undefined): string[] {
  if (!data) return []
  const errors: string[] = []
  requireModelForProvider(data.default_provider, data.default_model, 'Default', errors)

  const defaults = data.per_operation_defaults as Record<string, unknown> | undefined
  if (defaults) {
    requireModelForProvider(defaults.profile_provider, defaults.profile_model, 'Profile', errors)
    requireModelForProvider(defaults.demo_content_provider, defaults.demo_content_model, 'Demo content', errors)
    requireModelForProvider(defaults.qa_provider, defaults.qa_model, 'QA', errors)
    requireModelForProvider(defaults.outreach_provider, defaults.outreach_model, 'Outreach', errors)
  }

  return errors
}

function requireModelForProvider(provider: unknown, model: unknown, label: string, errors: string[]) {
  if (!provider || provider === 'deterministic') return
  if (typeof model !== 'string' || !model.trim()) errors.push(`${label} model is required for provider ${provider}`)
}
