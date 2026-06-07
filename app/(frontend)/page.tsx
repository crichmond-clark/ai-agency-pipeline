import { ArrowRight, Database, ShieldCheck, Sparkles } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: Database, title: 'Import leads', description: 'Bring in business-finder CSV exports without duplicating existing leads.' },
  { icon: Sparkles, title: 'Generate demos', description: 'Run bounded AI steps for profiles, content, QA, and outreach drafts.' },
  { icon: ShieldCheck, title: 'Approve safely', description: 'Keep human review, QA, and explicit send controls in the loop.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-8 lg:px-8">
        <nav className="flex justify-end"><ThemeToggle /></nav>
        <section className="rounded-2xl border bg-card p-8 shadow-sm sm:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">Human-in-the-loop pipeline</p>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-7xl">AI Demo Website Pipeline</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Import local business leads, generate reviewed concept mockups, run QA, and prepare outreach from one focused internal dashboard.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink className="gap-2" href="/dashboard/leads" size="lg">Open lead dashboard <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/admin" size="lg" variant="outline">Open Payload admin</ButtonLink>
            </div>
          </div>
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6">
                <feature.icon className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
