import { ArrowRight, Database, ShieldCheck, Sparkles } from 'lucide-react'

import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: Database, title: 'Import leads', description: 'Bring in business-finder CSV exports without duplicating existing leads.' },
  { icon: Sparkles, title: 'Generate demos', description: 'Run bounded AI steps for profiles, content, QA, and outreach drafts.' },
  { icon: ShieldCheck, title: 'Approve safely', description: 'Keep human review, QA, and explicit send controls in the loop.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative px-6 py-20 sm:py-28 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.45),_transparent_32rem),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.28),_transparent_28rem)]" />
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Human-in-the-loop pipeline</p>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-7xl">AI Demo Website Pipeline</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Import local business leads, generate reviewed concept mockups, run QA, and prepare outreach from one focused internal dashboard.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink className="gap-2" href="/dashboard/leads" size="lg">Open lead dashboard <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/admin" size="lg" variant="outline">Open Payload admin</ButtonLink>
            </div>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur" key={feature.title}>
                <CardContent className="pt-6">
                  <feature.icon className="h-7 w-7 text-blue-300" />
                  <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
