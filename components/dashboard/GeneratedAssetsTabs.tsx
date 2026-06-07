import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RecordLike = Record<string, unknown>

export function GeneratedAssetsTabs({ profile, demoSite, outreach, workflowRuns }: { profile?: RecordLike | null; demoSite?: RecordLike | null; outreach?: RecordLike | null; workflowRuns: RecordLike[] }) {
  const slug = typeof demoSite?.slug === 'string' ? demoSite.slug : undefined
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap justify-start">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="demo">Demo site</TabsTrigger>
        <TabsTrigger value="qa">QA</TabsTrigger>
        <TabsTrigger value="outreach">Outreach</TabsTrigger>
        <TabsTrigger value="runs">Workflow runs</TabsTrigger>
      </TabsList>
      <TabsContent value="profile"><JsonCard empty="No Business Profile generated yet." title="Business Profile" value={profile} /></TabsContent>
      <TabsContent value="demo">
        <Card>
          <CardHeader>
            <CardTitle>Demo Site</CardTitle>
            <CardDescription>Generated public concept mockup for this lead.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {slug ? <div className="flex flex-wrap items-center gap-3"><ButtonLink href={`/demo/${slug}`} target="_blank" variant="outline">Open /demo/{slug}</ButtonLink><StatusBadge value={demoSite?.is_public ? 'public' : 'private'} /></div> : <Alert><AlertDescription>No Demo Site generated yet.</AlertDescription></Alert>}
            <JsonBlock value={demoSite} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="qa"><JsonCard empty="No QA report saved yet. Run QA after generating the demo site." title="QA Report" value={asObject(demoSite?.qa_report)} /></TabsContent>
      <TabsContent value="outreach"><JsonCard empty="No Outreach Draft generated yet." title="Latest Outreach Draft" value={outreach} /></TabsContent>
      <TabsContent value="runs">
        <Card>
          <CardHeader>
            <CardTitle>Recent Workflow Runs</CardTitle>
            <CardDescription>Latest pipeline attempts, errors, and provider provenance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflowRuns.length ? workflowRuns.map((run) => <WorkflowRunCard key={String(run.id)} run={run} />) : <Alert><AlertDescription>No workflow runs yet.</AlertDescription></Alert>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function JsonCard({ title, value, empty }: { title: string; value?: RecordLike | null; empty: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{value ? <JsonBlock value={value} /> : <Alert><AlertDescription>{empty}</AlertDescription></Alert>}</CardContent>
    </Card>
  )
}

function WorkflowRunCard({ run }: { run: RecordLike }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{String(run.operation ?? 'Workflow')}</div>
        <StatusBadge value={typeof run.status === 'string' ? run.status : undefined} />
      </div>
      {run.summary ? <p className="mt-1 text-sm text-muted-foreground">{String(run.summary)}</p> : null}
      {run.error ? <p className="mt-1 text-sm text-destructive">{String(run.error)}</p> : null}
      {run.metadata ? <JsonBlock className="mt-3" value={asObject(run.metadata)} /> : null}
    </div>
  )
}

function JsonBlock({ value, className }: { value?: unknown; className?: string }) {
  if (!value) return null
  return <pre className={`max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs leading-5 ${className ?? ''}`}>{JSON.stringify(value, null, 2)}</pre>
}

function asObject(value: unknown): RecordLike | null {
  return value && typeof value === 'object' ? value as RecordLike : null
}
