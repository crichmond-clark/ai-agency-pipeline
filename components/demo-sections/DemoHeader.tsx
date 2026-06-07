import { Phone } from 'lucide-react'

import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoHeader({ content }: DemoSectionProps) {
  return (
    <header className="border-b border-[var(--demo-border)] bg-[var(--demo-bg)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
        <a className="text-2xl font-black tracking-[-0.04em] text-[var(--demo-primary)]" href="#top" aria-label={`${content.businessName} home`}>
          {content.businessName}
        </a>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--demo-muted)]" aria-label="Page sections">
          <a className="transition hover:text-[var(--demo-primary)]" href="#services">Services</a>
          <a className="transition hover:text-[var(--demo-primary)]" href="#why">Why call</a>
          <a className="transition hover:text-[var(--demo-primary)]" href="#contact">Contact</a>
        </nav>
        {content.phone ? (
          <a className="inline-flex items-center justify-center gap-2 bg-[var(--demo-accent)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--demo-on-accent)] transition brightness-100 hover:brightness-105" href={`tel:${content.phone}`}>
            <Phone className="h-4 w-4" />
            {content.phone}
          </a>
        ) : null}
      </div>
    </header>
  )
}
