import config from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest } from 'payload'

import { AiRunControls } from '@/components/admin/AiRunControls'
import { aiProviders, type AiProvider } from '@/lib/ai-provider-options'
import { resolveAiSelection } from '@/lib/ai-settings'
import { modelSuggestions } from '@/lib/ai-model-catalog'

export const dynamic = 'force-dynamic'

export default async function LeadReviewPage({ params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main><h1>Unauthorized</h1></main>

  const { leadId } = await params
  const lead = await payload.findByID({ collection: 'leads', id: leadId })
  const globalPayload = payload as unknown as { findGlobal(args: { slug: string }): Promise<unknown> }
  const [profiles, demos, outreachMessages, settings] = await Promise.all([
    payload.find({ collection: 'business-profiles', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    payload.find({ collection: 'outreach-messages', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    globalPayload.findGlobal({ slug: 'ai-settings' }).catch(() => ({})),
  ])
  const profile = profiles.docs[0]
  const demoSite = demos.docs[0]
  const outreach = outreachMessages.docs[0]
  const defaultSelection = await resolveAiSelection(payload, 'profile')
  const cache = (settings as { provider_model_cache?: Partial<Record<AiProvider, string[]>> }).provider_model_cache
  const suggestions = Object.fromEntries(aiProviders.map((provider) => [provider, modelSuggestions(provider, cache)])) as Partial<Record<AiProvider, string[]>>

  const actions = [
    {
      key: 'profile',
      label: 'Generate Profile',
      endpoint: `/api/leads/${lead.id}/generate-profile`,
      enabled: Boolean(lead.demo_creation_approved_at),
      disabledReason: lead.demo_creation_approved_at ? undefined : 'Demo Creation Approval required',
    },
    {
      key: 'demo-content',
      label: 'Generate Demo Content',
      endpoint: `/api/leads/${lead.id}/generate-demo-content`,
      enabled: Boolean(lead.demo_creation_approved_at && profile),
      disabledReason: !lead.demo_creation_approved_at ? 'Demo Creation Approval required' : profile ? undefined : 'Business Profile required',
    },
    {
      key: 'qa',
      label: 'Run QA',
      endpoint: demoSite ? `/api/demo-sites/${demoSite.id}/run-qa` : '#',
      enabled: Boolean(demoSite),
      disabledReason: demoSite ? undefined : 'Demo Site required',
    },
    {
      key: 'outreach',
      label: 'Generate Outreach Draft',
      endpoint: `/api/leads/${lead.id}/generate-outreach-draft`,
      enabled: Boolean(lead.pipeline_status === 'approved' && demoSite && !lead.do_not_contact_at),
      disabledReason: outreachDisabledReason(lead.pipeline_status, Boolean(demoSite), Boolean(lead.do_not_contact_at)),
    },
  ]

  return (
    <main style={{ padding: 32 }}>
      <p><Link href="/dashboard/leads">← Lead dashboard</Link></p>
      <h1>{lead.business_name}</h1>
      <dl style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 8 }}>
        <dt>City</dt><dd>{lead.city ?? '—'}</dd>
        <dt>Pipeline status</dt><dd>{lead.pipeline_status}</dd>
        <dt>Sales status</dt><dd>{lead.sales_status}</dd>
        <dt>Demo approved</dt><dd>{lead.demo_creation_approved_at ? 'yes' : 'no'}</dd>
        <dt>Business Profile</dt><dd>{profile ? `#${profile.id}` : 'missing'}</dd>
        <dt>Demo Site</dt><dd>{demoSite ? <Link href={`/demo/${demoSite.slug}`}>{demoSite.slug}</Link> : 'missing'}</dd>
        <dt>Outreach Draft</dt><dd>{outreach ? `#${outreach.id} (${outreach.status})` : 'missing'}</dd>
      </dl>
      <AiRunControls actions={actions} defaultModel={defaultSelection.model} defaultProvider={defaultSelection.provider} providers={[...aiProviders]} suggestions={suggestions} />
    </main>
  )
}

function outreachDisabledReason(pipelineStatus: string | null | undefined, hasDemo: boolean, doNotContact: boolean): string | undefined {
  if (doNotContact) return 'Lead is marked do not contact'
  if (pipelineStatus !== 'approved') return 'Lead must be approved'
  if (!hasDemo) return 'Available Demo Site required'
  return undefined
}
