import type { CollectionConfig } from 'payload'

export const OutreachMessages: CollectionConfig = {
  slug: 'outreach-messages',
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'lead', 'status', 'reviewed_at'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'demo_site', type: 'relationship', relationTo: 'demo-sites' },
    { name: 'subject', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'safety_notes', type: 'textarea' },
    { name: 'status', type: 'select', options: ['draft', 'reviewed', 'sent'], defaultValue: 'draft', required: true },
    { name: 'reviewed_at', type: 'date' },
    { name: 'sent_at', type: 'date', admin: { readOnly: true } },
  ],
}
