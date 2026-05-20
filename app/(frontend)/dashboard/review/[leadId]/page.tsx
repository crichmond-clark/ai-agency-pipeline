import config from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest } from 'payload'

import { AiRunControls } from '@/components/admin/AiRunControls'
import { AppShell } from '@/components/dashboard/AppShell'
import { InfoGrid } from '@/components/dashboard/InfoGrid'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { aiProviders, type AiProvider } from '@/lib/ai-provider-options'
import { modelSuggestions } from '@/lib/ai-model-catalog'
import { resolveAiSelection } from '@/lib/ai-settings'

export const dynamic = 'force-dynamic'

export default async function LeadReviewPage({ params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main className="p-8"><Alert variant="destructive">Unauthorized</Alert></main>

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
    <AppShell actions={<ButtonLink href="/dashboard/leads" variant="outline">Back to leads</ButtonLink>} description="Review generated assets, check gating state, and run the next approved workflow action." title={lead.business_name}>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead summary</CardTitle>
              <CardDescription>Current workflow, contactability, and generated asset state.</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoGrid items={[
                { label: 'City', value: lead.city ?? '—' },
                { label: 'Pipeline status', value: <StatusBadge value={lead.pipeline_status} /> },
                { label: 'Sales status', value: <StatusBadge value={lead.sales_status} /> },
                { label: 'Demo creation', value: <StatusBadge value={Boolean(lead.demo_creation_approved_at)} /> },
                { label: 'Do not contact', value: <StatusBadge value={lead.do_not_contact_at ? 'do_not_contact' : 'contact_allowed'} /> },
                { label: 'Email', value: lead.email ?? '—' },
              ]} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <AssetCard title="Business Profile" value={profile ? `#${profile.id}` : 'Missing'} ready={Boolean(profile)} />
            <AssetCard href={demoSite?.slug ? `/demo/${demoSite.slug}` : undefined} title="Demo Site" value={demoSite?.slug ?? 'Missing'} ready={Boolean(demoSite)} />
            <AssetCard title="Outreach Draft" value={outreach ? `#${outreach.id} (${outreach.status})` : 'Missing'} ready={Boolean(outreach)} />
          </div>
        </div>
        <AiRunControls actions={actions} defaultModel={defaultSelection.model} defaultProvider={defaultSelection.provider} providers={[...aiProviders]} suggestions={suggestions} />
      </div>
    </AppShell>
  )
}

function AssetCard({ title, value, ready, href }: { title: string; value: string; ready: boolean; href?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <StatusBadge value={ready} />
        </div>
      </CardHeader>
      <CardContent>
        {href ? <Link className="font-semibold text-blue-400 hover:text-blue-300" href={href}>{value}</Link> : <p className="text-sm font-medium text-zinc-300">{value}</p>}
      </CardContent>
    </Card>
  )
}

function outreachDisabledReason(pipelineStatus: string | null | undefined, hasDemo: boolean, doNotContact: boolean): string | undefined {
  if (doNotContact) return 'Lead is marked do not contact'
  if (pipelineStatus !== 'approved') return 'Lead must be approved'
  if (!hasDemo) return 'Available Demo Site required'
  return undefined
}
