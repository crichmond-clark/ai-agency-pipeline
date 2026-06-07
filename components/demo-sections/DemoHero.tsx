import { ArrowRight, MapPin, Phone } from 'lucide-react'

import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoHero({ content }: DemoSectionProps) {
  return (
    <section className="border-b border-[var(--demo-border)]" id="top">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.15fr_0.85fr]">
        <div className="px-5 py-16 md:py-24 lg:px-8 lg:py-28">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-[var(--demo-accent)]">{content.hero.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-[var(--demo-primary)] sm:text-6xl lg:text-7xl">
            {content.hero.headline}
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-[var(--demo-muted)]">{content.hero.subheadline}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex items-center justify-center gap-3 bg-[var(--demo-primary)] px-7 py-4 font-black uppercase tracking-[0.16em] text-[var(--demo-on-primary)] transition brightness-100 hover:brightness-125" href={content.contactHref}>
              {content.phone ? `Call ${content.phone}` : content.hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a className="inline-flex items-center justify-center border-2 border-[var(--demo-primary)] px-7 py-4 font-black uppercase tracking-[0.16em] text-[var(--demo-primary)] transition hover:bg-[var(--demo-primary)] hover:text-[var(--demo-on-primary)]" href={content.secondaryContactHref}>
              {content.hero.secondaryCta}
            </a>
          </div>
        </div>

        <aside className="border-t border-[var(--demo-border)] bg-[var(--demo-primary-strong)] px-5 py-12 text-[var(--demo-on-primary)] lg:border-l lg:border-t-0 lg:px-10 lg:py-28" aria-label="Contact summary">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--demo-accent)]">Local service</p>
          <div className="mt-8 space-y-8">
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-[var(--demo-accent)]" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">Area</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{content.serviceAreaLabel}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-start gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-[var(--demo-accent)]" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">Contact</p>
                  {content.phone ? <a className="mt-2 block text-3xl font-black tracking-[-0.05em] text-white transition hover:text-[var(--demo-accent)]" href={`tel:${content.phone}`}>{content.phone}</a> : <p className="mt-2 text-2xl font-black tracking-[-0.04em]">Use the enquiry details below</p>}
                  {content.email ? <a className="mt-3 block text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white" href={`mailto:${content.email}`}>{content.email}</a> : null}
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 pt-6">
              <p className="max-w-md text-lg leading-8 text-white/80">{content.contactCta.body}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
