import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const ContactAttempts: CollectionConfig = {
  slug: 'contact-attempts',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
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
