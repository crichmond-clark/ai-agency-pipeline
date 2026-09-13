import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const OutreachSendOperations: CollectionConfig = {
  slug: 'outreach-send-operations',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: { useAsTitle: 'idempotency_key', defaultColumns: ['lead', 'state', 'idempotency_key', 'provider_message_id'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'outreach_message', type: 'relationship', relationTo: 'outreach-messages', required: true },
    { name: 'purpose', type: 'select', options: ['initial_outreach'], defaultValue: 'initial_outreach', required: true },
    { name: 'active_slot_key', type: 'text', unique: true },
    { name: 'state', type: 'select', options: ['reserved', 'dispatching', 'unknown', 'failed', 'sent', 'canceled'], defaultValue: 'reserved', required: true },
    { name: 'idempotency_key', type: 'text', required: true, unique: true },
    { name: 'snapshot', type: 'json', required: true },
    { name: 'first_dispatched_at', type: 'date' },
    { name: 'last_attempt_at', type: 'date' },
    { name: 'provider_message_id', type: 'text' },
    { name: 'error_category', type: 'text' },
    { name: 'error_message', type: 'textarea' },
    { name: 'reconciled_at', type: 'date' },
    { name: 'reconciled_by', type: 'relationship', relationTo: 'users' },
    { name: 'reconciliation_evidence', type: 'textarea' },
  ],
}
