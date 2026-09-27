import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected']
const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost']
const websiteStatuses = ['no_site', 'social_only', 'third_party_platform', 'broken', 'live', 'unknown']

export const Leads: CollectionConfig = {
  slug: 'leads',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
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
    { name: 'website_submission_id', type: 'number', unique: true, admin: { readOnly: true } },
    { name: 'website_submission_hash', type: 'text', admin: { readOnly: true } },
    { name: 'enquiry_contact_name', type: 'text', admin: { readOnly: true } },
    { name: 'enquiry_subject', type: 'text', admin: { readOnly: true } },
    { name: 'enquiry_message', type: 'textarea', admin: { readOnly: true } },
    { name: 'enquiry_need', type: 'select', options: ['new_website', 'replace_existing', 'ecommerce', 'content_website', 'not_sure'], admin: { readOnly: true } },
    { name: 'enquiry_goal', type: 'select', options: ['more_enquiries', 'more_calls', 'sell_online', 'credibility', 'replace_outdated', 'other'], admin: { readOnly: true } },
    { name: 'qualification_status', type: 'select', options: ['unreviewed', 'qualified', 'not_fit'], defaultValue: 'unreviewed', required: true },
    { name: 'source_imported_at', type: 'date' },
    { name: 'source_payload', type: 'json' },
    { name: 'website_status', type: 'select', options: websiteStatuses, defaultValue: 'unknown', required: true },
    { name: 'pipeline_status', type: 'select', options: pipelineStatuses, defaultValue: 'new', required: true },
    { name: 'sales_status', type: 'select', options: salesStatuses, defaultValue: 'not_contacted', required: true },
    { name: 'demo_creation_approved_at', type: 'date', admin: { readOnly: true } },
    { name: 'demo_creation_approved_by', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'source_revision', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'workflow_revision', type: 'number', defaultValue: 1, admin: { readOnly: true } },
    { name: 'approved_demo_site', type: 'relationship', relationTo: 'demo-sites', admin: { readOnly: true } },
    { name: 'approved_demo_revision', type: 'number', admin: { readOnly: true } },
    { name: 'approved_at', type: 'date', admin: { readOnly: true } },
    { name: 'approved_by', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'do_not_contact_at', type: 'date' },
    { name: 'do_not_contact_reason', type: 'textarea' },
    { name: 'last_contacted_at', type: 'date', admin: { readOnly: true } },
    { name: 'is_sample_lead', type: 'checkbox', defaultValue: false },
  ],
  hooks: {
    beforeValidate: [({ data, originalDoc, context }) => {
      const inboundKeys = ['website_submission_id', 'website_submission_hash', 'enquiry_contact_name', 'enquiry_subject', 'enquiry_message', 'enquiry_need', 'enquiry_goal']
      if (!context?.websiteEnquiryIngestion && data && inboundKeys.some((field) => data[field] !== undefined)) throw new Error('Website enquiry fields are managed by ingestion')
      if (data?.qualification_status !== undefined && originalDoc && data.qualification_status !== originalDoc.qualification_status && data.qualification_status !== 'unreviewed' && !context?.qualificationOperation) throw new Error('Qualification changes must use the qualification workflow')
      if (originalDoc && data?.pipeline_status === 'approved' && originalDoc.pipeline_status !== 'approved' && !context?.workflowOperation) throw new Error('Pipeline approval must use the approval workflow')
      if (data?.business_name) data.normalized_business_name = data.business_name.trim().toLowerCase().replace(/\s+/g, ' ')
      if (originalDoc && data) {
        const sourceChanged = ['business_name', 'city', 'address', 'phone', 'email', 'website_url', 'website_status', 'source_payload'].some((field) => data[field] !== undefined && data[field] !== originalDoc[field])
        if (sourceChanged) {
          data.source_revision = (originalDoc.source_revision ?? 1) + 1
          data.workflow_revision = (originalDoc.workflow_revision ?? 1) + 1
          data.approved_demo_site = null
          data.approved_demo_revision = null
          data.approved_at = null
          data.approved_by = null
          if (data.pipeline_status === 'approved') data.pipeline_status = 'new'
        }
      }
      return data
    }],
  },
}
