import type { CollectionConfig } from 'payload'

export const WorkflowRuns: CollectionConfig = {
  slug: 'workflow-runs',
  admin: { useAsTitle: 'operation', defaultColumns: ['operation', 'status', 'lead', 'started_at', 'finished_at'] },
  fields: [
    { name: 'operation', type: 'select', options: ['csv_import', 'profile_generation', 'demo_content_generation', 'demo_site_creation', 'screenshot_capture', 'qa_check', 'outreach_generation', 'outreach_send'], required: true },
    { name: 'status', type: 'select', options: ['started', 'succeeded', 'failed'], required: true },
    { name: 'lead', type: 'relationship', relationTo: 'leads' },
    { name: 'demo_site', type: 'relationship', relationTo: 'demo-sites' },
    { name: 'outreach_message', type: 'relationship', relationTo: 'outreach-messages' },
    { name: 'started_at', type: 'date', required: true },
    { name: 'finished_at', type: 'date' },
    { name: 'summary', type: 'textarea' },
    { name: 'error', type: 'textarea' },
    { name: 'metadata', type: 'json' },
  ],
}
