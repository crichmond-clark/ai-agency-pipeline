import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

const managedFields = ['lead', 'active_lead', 'status', 'delivery_status', 'token_hash', 'expires_at', 'submitted_at', 'reviewed_at', 'answers', 'verification_flags', 'assets', 'accepted_facts', 'review_decisions', 'invited_by'] as const
const operationFields = {
  invite: ['lead', 'active_lead', 'status', 'delivery_status', 'token_hash', 'expires_at', 'invited_by'],
  revoke: ['active_lead', 'status'],
  delivery: ['delivery_status'],
  submit: ['active_lead', 'status', 'token_hash', 'submitted_at', 'answers', 'verification_flags', 'assets'],
  review: ['status', 'reviewed_at', 'accepted_facts', 'review_decisions', 'verification_flags'],
} as const

export const ClientIntakes: CollectionConfig = {
  slug: 'client-intakes',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: () => false,
  },
  admin: { useAsTitle: 'lead', defaultColumns: ['lead', 'status', 'delivery_status', 'expires_at', 'submitted_at'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'active_lead', type: 'relationship', relationTo: 'leads', unique: true, admin: { readOnly: true, description: 'Database-enforced active invitation slot; cleared on submission or revocation.' } },
    { name: 'status', type: 'select', options: ['invited', 'submitted', 'reviewed', 'revoked'], defaultValue: 'invited', required: true },
    { name: 'delivery_status', type: 'select', options: ['unsent', 'sent', 'failed'], defaultValue: 'unsent', required: true },
    { name: 'token_hash', type: 'text', unique: true, admin: { readOnly: true } },
    { name: 'expires_at', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'submitted_at', type: 'date', admin: { readOnly: true } },
    { name: 'reviewed_at', type: 'date', admin: { readOnly: true } },
    { name: 'answers', type: 'json', admin: { readOnly: true } },
    { name: 'verification_flags', type: 'json', admin: { readOnly: true } },
    { name: 'assets', type: 'json', admin: { readOnly: true } },
    { name: 'accepted_facts', type: 'json', admin: { readOnly: true } },
    { name: 'review_decisions', type: 'json', admin: { readOnly: true } },
    { name: 'invited_by', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [({ data, context }) => {
      const operation = context?.clientIntakeOperation
      const allowed = typeof operation === 'string'
        ? operationFields[operation as keyof typeof operationFields] ?? []
        : []
      if (data && managedFields.some((field) => field in data && !(allowed as readonly string[]).includes(field))) {
        throw new Error('Client intake records must be changed through the invitation, submission, delivery, or review workflow')
      }
      return data
    }],
  },
}
