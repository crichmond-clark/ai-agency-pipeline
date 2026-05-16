import type { CollectionConfig } from 'payload'

const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected']
const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost']
const websiteStatuses = ['no_site', 'social_only', 'third_party_platform', 'broken', 'live', 'unknown']

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { useAsTitle: 'business_name', defaultColumns: ['business_name', 'city', 'website_status', 'pipeline_status', 'sales_status'] },
  fields: [
    { name: 'business_name', type: 'text', required: true },
    { name: 'normalized_business_name', type: 'text', admin: { readOnly: true } },
    { name: 'city', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'website_url', type: 'text' },
    { name: 'google_place_id', type: 'text', unique: true },
    { name: 'lead_source', type: 'text', defaultValue: 'business-finder-csv' },
    { name: 'source_imported_at', type: 'date' },
    { name: 'source_payload', type: 'json' },
    { name: 'website_status', type: 'select', options: websiteStatuses, defaultValue: 'unknown', required: true },
    { name: 'pipeline_status', type: 'select', options: pipelineStatuses, defaultValue: 'new', required: true },
    { name: 'sales_status', type: 'select', options: salesStatuses, defaultValue: 'not_contacted', required: true },
    { name: 'demo_creation_approved_at', type: 'date', admin: { readOnly: true } },
    { name: 'demo_creation_approved_by', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'do_not_contact_at', type: 'date' },
    { name: 'do_not_contact_reason', type: 'textarea' },
    { name: 'last_contacted_at', type: 'date', admin: { readOnly: true } },
    { name: 'is_sample_lead', type: 'checkbox', defaultValue: false },
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      if (data?.business_name) data.normalized_business_name = data.business_name.trim().toLowerCase().replace(/\s+/g, ' ')
      return data
    }],
  },
}
