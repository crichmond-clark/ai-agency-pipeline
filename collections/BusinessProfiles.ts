import type { CollectionConfig } from 'payload'

export const BusinessProfiles: CollectionConfig = {
  slug: 'business-profiles',
  admin: { useAsTitle: 'lead' },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true, unique: true },
    { name: 'industry', type: 'text', required: true },
    { name: 'services', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] },
    { name: 'verified_facts', type: 'array', fields: [{ name: 'fact', type: 'text', required: true }, { name: 'source', type: 'text' }] },
    { name: 'assumptions', type: 'array', fields: [{ name: 'assumption', type: 'text', required: true }] },
    { name: 'confidence', type: 'number', min: 0, max: 1 },
    { name: 'missing_information', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
    { name: 'raw_profile', type: 'json' },
  ],
}
