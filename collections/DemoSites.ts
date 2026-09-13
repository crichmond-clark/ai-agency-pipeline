import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const DemoSites: CollectionConfig = {
  slug: 'demo-sites',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: { useAsTitle: 'slug', defaultColumns: ['slug', 'lead', 'template', 'is_public', 'expires_at'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'business_profile', type: 'relationship', relationTo: 'business-profiles' },
    { name: 'template', type: 'select', options: ['home_services'], defaultValue: 'home_services', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'content', type: 'json', required: true },
    { name: 'content_revision', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'template_version', type: 'text', defaultValue: 'home_services.v1', admin: { readOnly: true } },
    { name: 'desktop_screenshot', type: 'upload', relationTo: 'media' },
    { name: 'mobile_screenshot', type: 'upload', relationTo: 'media' },
    { name: 'qa_report', type: 'json' },
    { name: 'is_public', type: 'checkbox', defaultValue: false },
    { name: 'expires_at', type: 'date' },
    { name: 'removed_at', type: 'date' },
    { name: 'removal_reason', type: 'textarea' },
  ],
  hooks: {
    beforeValidate: [({ data, originalDoc, context }) => {
      if (originalDoc && data?.qa_report !== undefined && !context?.workflowOperation) throw new Error('QA reports must use the QA workflow')
      if (originalDoc && data?.content !== undefined && JSON.stringify(data.content) !== JSON.stringify(originalDoc.content)) {
        data.content_revision = (originalDoc.content_revision ?? 1) + 1
        data.qa_report = null
      }
      return data
    }],
  },
}
