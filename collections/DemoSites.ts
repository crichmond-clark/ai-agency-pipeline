import type { CollectionConfig } from 'payload'

export const DemoSites: CollectionConfig = {
  slug: 'demo-sites',
  admin: { useAsTitle: 'slug', defaultColumns: ['slug', 'lead', 'template', 'is_public', 'expires_at'] },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'business_profile', type: 'relationship', relationTo: 'business-profiles' },
    { name: 'template', type: 'select', options: ['home_services'], defaultValue: 'home_services', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'content', type: 'json', required: true },
    { name: 'desktop_screenshot', type: 'upload', relationTo: 'media' },
    { name: 'mobile_screenshot', type: 'upload', relationTo: 'media' },
    { name: 'qa_report', type: 'json' },
    { name: 'is_public', type: 'checkbox', defaultValue: false },
    { name: 'expires_at', type: 'date' },
    { name: 'removed_at', type: 'date' },
    { name: 'removal_reason', type: 'textarea' },
  ],
}
