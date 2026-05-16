import type { CollectionConfig } from 'payload'

export const ContactAttempts: CollectionConfig = {
  slug: 'contact-attempts',
  admin: { useAsTitle: 'channel', defaultColumns: ['lead', 'channel', 'sent_at', 'provider_message_id'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'outreach_message', type: 'relationship', relationTo: 'outreach-messages' },
    { name: 'channel', type: 'select', options: ['email', 'phone'], defaultValue: 'email', required: true },
    { name: 'sent_at', type: 'date', required: true },
    { name: 'provider', type: 'text' },
    { name: 'provider_message_id', type: 'text' },
    { name: 'summary', type: 'textarea' },
  ],
}
