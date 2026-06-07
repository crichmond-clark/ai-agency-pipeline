import { CheckCircle2 } from 'lucide-react'

import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoTrust({ content }: DemoSectionProps) {
  return (
    <section className="border-b border-[var(--demo-border)] bg-[var(--demo-primary)] text-[var(--demo-on-primary)]" id="why">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[0.44fr_1fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--demo-accent)]">Why call</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">Practical details before a customer gets in touch</h2>
        </div>
        <div className="border-t border-white/20">
          {content.trustReasons.map((reason) => (
            <div className="flex gap-5 border-b border-white/20 py-6" key={reason}>
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--demo-accent)]" />
              <p className="text-xl leading-8 text-white/80">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
