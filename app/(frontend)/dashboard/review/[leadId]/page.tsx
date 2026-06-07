import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest } from 'payload'

import { AppShell } from '@/components/dashboard/AppShell'
import { GeneratedAssetsTabs } from '@/components/dashboard/GeneratedAssetsTabs'
import { LeadSummaryCard, type LeadSummary } from '@/components/dashboard/LeadSummaryCard'
import { OutreachDraftPanel, type OutreachDraft } from '@/components/dashboard/OutreachDraftPanel'
import { SystemReadinessCard } from '@/components/dashboard/SystemReadinessCard'
import { WorkflowActionPanel, type WorkflowAction } from '@/components/dashboard/WorkflowActionPanel'
import { WorkflowStepper, type WorkflowStage } from '@/components/dashboard/WorkflowStepper'
import { Alert } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { aiProviders, type AiProvider } from '@/lib/ai-provider-options'
import { modelSuggestions } from '@/lib/ai-model-catalog'
import { resolveAiSelection } from '@/lib/ai-settings'
import { getSystemStatus } from '@/lib/system-status'
import { getApprovalBlockReason, getOutreachReviewBlockReason, getSendBlockReason } from '@/lib/workflow-guards'

export const dynamic = 'force-dynamic'

type RecordLike = Record<string, unknown>

export default async function LeadReviewPage({ params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main className="p-8"><Alert variant="destructive">Unauthorized</Alert></main>

  const { leadId } = await params
  const lead = await payload.findByID({ collection: 'leads', id: leadId })
  const globalPayload = payload as unknown as { findGlobal(args: { slug: string }): Promise<unknown> }
  const [profiles, demos, outreachMessages, workflowRuns, settings, defaultSelection, systemStatus] = await Promise.all([
    payload.find({ collection: 'business-profiles', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    payload.find({ collection: 'outreach-messages', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    payload.find({ collection: 'workflow-runs', where: { lead: { equals: lead.id } }, limit: 8, sort: '-started_at' }),
    globalPayload.findGlobal({ slug: 'ai-settings' }).catch(() => ({})),
    resolveAiSelection(payload, 'profile'),
    getSystemStatus(),
  ])
  const profile = profiles.docs[0]
  const demoSite = demos.docs[0]
  const outreach = outreachMessages.docs[0]
  const cache = (settings as { provider_model_cache?: Partial<Record<AiProvider, string[]>> }).provider_model_cache
  const suggestions = Object.fromEntries(aiProviders.map((provider) => [provider, modelSuggestions(provider, cache)])) as Partial<Record<AiProvider, string[]>>

  const actions = workflowActions({ lead: asRecord(lead), profile: asOptionalRecord(profile), demoSite: asOptionalRecord(demoSite), outreach: asOptionalRecord(outreach), portfolioMode: systemStatus.portfolioMode, resendConfigured: systemStatus.resendConfigured, r2Configured: systemStatus.r2Configured })
  const stages = workflowStages({ lead: asRecord(lead), profile: Boolean(profile), demoSite: Boolean(demoSite), outreachStatus: typeof outreach?.status === 'string' ? outreach.status : undefined })

  return (
    <AppShell actions={<ButtonLink href="/dashboard/leads" variant="outline">Back to leads</ButtonLink>} description="Review generated assets, check gating state, and run the next approved workflow action." title={lead.business_name}>
      <div className="grid gap-6">
        <SystemReadinessCard status={systemStatus} />
        <WorkflowStepper stages={stages} />
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-6">
            <LeadSummaryCard lead={lead as LeadSummary} />
            <OutreachDraftPanel outreach={outreach ? outreach as OutreachDraft : null} />
            <GeneratedAssetsTabs demoSite={asOptionalRecord(demoSite)} outreach={asOptionalRecord(outreach)} profile={asOptionalRecord(profile)} workflowRuns={workflowRuns.docs.map(asRecord)} />
          </div>
          <div className="grid content-start gap-6">
            <WorkflowActionPanel actions={actions} defaultModel={defaultSelection.model} defaultProvider={defaultSelection.provider} providers={[...aiProviders]} suggestions={suggestions} />
            <Card>
              <CardHeader>
                <CardTitle>Workflow guide</CardTitle>
                <CardDescription>The happy path for one lead.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Approve demo creation → generate profile → generate demo content → review demo → run QA → approve/reject → generate and review outreach. Sending remains blocked while portfolio mode is on.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function asRecord(value: unknown): RecordLike {
  return value as RecordLike
}

function asOptionalRecord(value: unknown): RecordLike | null {
  return value ? value as RecordLike : null
}

function workflowActions({ lead, profile, demoSite, outreach, portfolioMode, resendConfigured, r2Configured }: { lead: RecordLike; profile?: RecordLike | null; demoSite?: RecordLike | null; outreach?: RecordLike | null; portfolioMode: boolean; resendConfigured: boolean; r2Configured: boolean }): WorkflowAction[] {
  const leadId = String(lead.id)
  const demoSiteId = demoSite?.id ? String(demoSite.id) : undefined
  const outreachId = outreach?.id ? String(outreach.id) : undefined
  const approvalBlock = getApprovalBlockReason({ lead, demoSite })
  const reviewBlock = outreach ? getOutreachReviewBlockReason({ lead, demoSite, outreach }) : 'Outreach draft required'
  const sendBlock = outreach ? getSendBlockReason({ lead, demoSite, outreach, portfolioMode }) : 'Outreach draft required'
  const sendReadinessBlock = !resendConfigured && !portfolioMode ? 'Resend is not configured' : sendBlock

  return [
    {
      key: 'approve-demo-creation',
      label: 'Approve Demo Creation',
      description: 'Allow AI generation to start for this lead.',
      endpoint: `/api/leads/${leadId}/approve-demo-creation`,
      enabled: !lead.demo_creation_approved_at,
      disabledReason: 'Demo creation has already been approved.',
      status: lead.demo_creation_approved_at ? 'complete' : 'ready',
      confirm: { title: 'Approve demo creation?', description: 'This records your approval and enables AI profile/demo generation for this lead.' },
    },
    {
      key: 'profile',
      label: 'Generate Profile',
      description: 'Create the structured Business Profile with the AI service.',
      endpoint: `/api/leads/${leadId}/generate-profile`,
      enabled: Boolean(lead.demo_creation_approved_at),
      disabledReason: 'Demo Creation Approval required.',
      status: profile ? 'complete' : lead.demo_creation_approved_at ? 'ready' : 'blocked',
      aiTask: true,
    },
    {
      key: 'demo-content',
      label: 'Generate Demo Content',
      description: 'Generate homepage content and create/update the Demo Site.',
      endpoint: `/api/leads/${leadId}/generate-demo-content`,
      enabled: Boolean(lead.demo_creation_approved_at && profile),
      disabledReason: !lead.demo_creation_approved_at ? 'Demo Creation Approval required.' : 'Business Profile required.',
      status: demoSite ? 'complete' : lead.demo_creation_approved_at && profile ? 'ready' : 'blocked',
      aiTask: true,
    },
    {
      key: 'screenshots',
      label: 'Capture Screenshots',
      description: 'Capture desktop and mobile screenshots to R2.',
      endpoint: demoSiteId ? `/api/demo-sites/${demoSiteId}/capture-screenshots` : '#',
      enabled: Boolean(demoSiteId && r2Configured),
      disabledReason: demoSiteId ? 'Cloudflare R2 storage is not configured.' : 'Demo Site required.',
      status: demoSiteId && r2Configured ? 'ready' : 'blocked',
    },
    {
      key: 'qa',
      label: 'Run QA',
      description: 'Run deterministic and AI-assisted QA checks.',
      endpoint: demoSiteId ? `/api/demo-sites/${demoSiteId}/run-qa` : '#',
      enabled: Boolean(demoSiteId),
      disabledReason: 'Demo Site required.',
      status: demoSiteId ? 'ready' : 'blocked',
      aiTask: true,
    },
    {
      key: 'approve',
      label: 'Approve Lead',
      description: 'Final human approval for this demo and outreach workflow.',
      endpoint: `/api/leads/${leadId}/approve`,
      enabled: !approvalBlock,
      disabledReason: approvalBlock ?? undefined,
      status: lead.pipeline_status === 'approved' ? 'complete' : approvalBlock ? 'blocked' : 'ready',
      confirm: { title: 'Approve this lead?', description: 'Approval converts the lead into a prospect and allows outreach draft generation.' },
    },
    {
      key: 'reject',
      label: 'Reject Lead',
      description: 'Stop this lead from moving forward.',
      endpoint: `/api/leads/${leadId}/reject`,
      enabled: lead.pipeline_status !== 'rejected',
      disabledReason: 'Lead is already rejected.',
      status: lead.pipeline_status === 'rejected' ? 'complete' : 'ready',
      confirm: { title: 'Reject this lead?', description: 'This marks the lead as rejected. You can still inspect its records later.', destructive: true },
    },
    {
      key: 'outreach',
      label: 'Generate Outreach Draft',
      description: 'Generate editable outreach copy for the approved prospect.',
      endpoint: `/api/leads/${leadId}/generate-outreach-draft`,
      enabled: Boolean(lead.pipeline_status === 'approved' && demoSite && !lead.do_not_contact_at),
      disabledReason: outreachDisabledReason(lead, Boolean(demoSite)),
      status: outreach ? 'complete' : lead.pipeline_status === 'approved' && demoSite && !lead.do_not_contact_at ? 'ready' : 'blocked',
      aiTask: true,
    },
    {
      key: 'mark-reviewed',
      label: 'Mark Outreach Reviewed',
      description: 'Accept the current draft as human-reviewed.',
      endpoint: outreachId ? `/api/outreach-messages/${outreachId}/mark-reviewed` : '#',
      enabled: Boolean(outreachId && !reviewBlock),
      disabledReason: reviewBlock ?? undefined,
      status: outreach?.status === 'reviewed' || outreach?.status === 'sent' ? 'complete' : outreachId && !reviewBlock ? 'ready' : 'blocked',
      confirm: { title: 'Mark draft reviewed?', description: 'Confirm you have checked the outreach copy and safety notes.' },
    },
    {
      key: 'send',
      label: 'Send Outreach',
      description: 'Send one approved outreach email via Resend.',
      endpoint: outreachId ? `/api/outreach-messages/${outreachId}/send` : '#',
      enabled: Boolean(outreachId && !sendReadinessBlock),
      disabledReason: sendReadinessBlock ?? undefined,
      status: outreach?.status === 'sent' ? 'complete' : outreachId && !sendReadinessBlock ? 'ready' : 'blocked',
      confirm: { title: 'Send this email?', description: 'This sends a real email and records a contact attempt. There is no bulk or automatic send.', destructive: true },
    },
  ]
}

function workflowStages({ lead, profile, demoSite, outreachStatus }: { lead: RecordLike; profile: boolean; demoSite: boolean; outreachStatus?: string }): WorkflowStage[] {
  return [
    { key: 'approval', label: 'Demo approval', description: lead.demo_creation_approved_at ? 'Generation approved.' : 'Approve before using AI.', state: lead.demo_creation_approved_at ? 'done' : 'current' },
    { key: 'profile', label: 'Profile', description: profile ? 'Business Profile exists.' : 'Generate structured business facts.', state: profile ? 'done' : lead.demo_creation_approved_at ? 'current' : 'blocked' },
    { key: 'demo', label: 'Demo', description: demoSite ? 'Demo Site exists.' : 'Generate template content.', state: demoSite ? 'done' : profile ? 'current' : 'blocked' },
    { key: 'qa', label: 'QA + review', description: qaDescription(lead.pipeline_status), state: qaStageState(lead.pipeline_status) },
    { key: 'outreach', label: 'Outreach', description: outreachStatus ? `Draft status: ${outreachStatus}.` : 'Generate after approval.', state: outreachStatus === 'sent' || outreachStatus === 'reviewed' ? 'done' : lead.pipeline_status === 'approved' ? 'current' : 'blocked' },
  ]
}

function qaStageState(pipelineStatus: unknown): WorkflowStage['state'] {
  if (pipelineStatus === 'approved') return 'done'
  if (pipelineStatus === 'needs_review') return 'current'
  if (pipelineStatus === 'qa_failed') return 'blocked'
  if (pipelineStatus === 'demo_ready') return 'current'
  return 'blocked'
}

function qaDescription(pipelineStatus: unknown): string {
  if (pipelineStatus === 'approved') return 'Lead approved.'
  if (pipelineStatus === 'needs_review') return 'QA passed; human decision required.'
  if (pipelineStatus === 'qa_failed') return 'QA failed; regenerate or inspect issues.'
  return 'Run QA after demo generation.'
}

function outreachDisabledReason(lead: RecordLike, hasDemo: boolean): string | undefined {
  if (lead.do_not_contact_at) return 'Lead is marked do not contact.'
  if (lead.pipeline_status !== 'approved') return 'Lead must be approved.'
  if (!hasDemo) return 'Available Demo Site required.'
  return undefined
}
