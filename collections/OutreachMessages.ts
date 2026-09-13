import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const OutreachMessages: CollectionConfig = {
  slug: 'outreach-messages',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'lead', 'status', 'reviewed_at'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'demo_site', type: 'relationship', relationTo: 'demo-sites' },
    { name: 'subject', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'safety_notes', type: 'textarea' },
    { name: 'status', type: 'select', options: ['draft', 'reviewed', 'sending', 'sent'], defaultValue: 'draft', required: true },
    { name: 'reviewed_at', type: 'date' },
    { name: 'sent_at', type: 'date', admin: { readOnly: true } },
    { name: 'content_revision', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'reviewed_fingerprint', type: 'text', admin: { readOnly: true } },
    { name: 'send_idempotency_key', type: 'text', admin: { readOnly: true } },
    { name: 'send_claimed_at', type: 'date', admin: { readOnly: true } },
  ],
  hooks: {
    beforeValidate: [({ data, originalDoc, context }) => {
      if (originalDoc && ['sending', 'sent'].includes(data?.status as string) && originalDoc.status !== data?.status && !context?.workflowOperation) throw new Error('Sending state must use the outreach workflow')
      if (originalDoc && data) {
        const messageChanged = (data.subject !== undefined && data.subject !== originalDoc.subject) || (data.body !== undefined && data.body !== originalDoc.body) || (data.lead !== undefined && data.lead !== originalDoc.lead) || (data.demo_site !== undefined && data.demo_site !== originalDoc.demo_site)
        if (messageChanged) {
          data.content_revision = (originalDoc.content_revision ?? 1) + 1
          data.status = 'draft'
          data.reviewed_at = null
          data.reviewed_fingerprint = null
        }
      }
      return data
    }],
  },
}
