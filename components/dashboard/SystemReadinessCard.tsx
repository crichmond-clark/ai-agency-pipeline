import { Cpu, Database, Mail, ShieldCheck, Sparkles } from 'lucide-react'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type SystemStatus = {
  appUrl: string
  portfolioMode: boolean
  aiServiceConfigured: boolean
  aiServiceReachable?: boolean
  aiProvider: string
  databaseConfigured: boolean
  r2Configured: boolean
  resendConfigured: boolean
}

export function SystemReadinessCard({ status }: { status: SystemStatus }) {
  const items = [
    { icon: Database, label: 'Database', ready: status.databaseConfigured, detail: 'Neon connection configured' },
    { icon: Cpu, label: 'AI service', ready: status.aiServiceConfigured && Boolean(status.aiServiceReachable), detail: `${status.aiProvider} / ${status.aiServiceReachable ? 'reachable' : 'not reachable'}` },
    { icon: Sparkles, label: 'Screenshots', ready: status.r2Configured, detail: 'Cloudflare R2 required' },
    { icon: Mail, label: 'Sending', ready: status.resendConfigured && !status.portfolioMode, detail: status.portfolioMode ? 'Blocked by portfolio mode' : 'Resend configured' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> System readiness</CardTitle>
        <CardDescription>Capability checks for local MVP testing. No secrets are exposed here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <ReadinessItem key={item.label} {...item} />)}
        </div>
        {status.portfolioMode ? <Alert variant="warning"><AlertDescription>Portfolio mode is on. Real outreach sending is intentionally blocked.</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  )
}

function ReadinessItem({ icon: Icon, label, ready, detail }: { icon: typeof Cpu; label: string; ready: boolean; detail: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</div>
        <StatusBadge value={ready ? 'configured' : 'missing'} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
