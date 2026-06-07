import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoCta({ content }: DemoSectionProps) {
  return (
    <section className="bg-[var(--demo-accent)]" id="contact">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <p className="font-black uppercase tracking-[0.24em] text-[var(--demo-on-accent)] opacity-80">{content.serviceArea}</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] text-[var(--demo-on-accent)] md:text-5xl">{content.contactCta.headline}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          {content.phone ? <a className="bg-[var(--demo-primary)] px-7 py-4 text-center font-black uppercase tracking-[0.16em] text-[var(--demo-on-primary)] transition brightness-100 hover:brightness-125" href={`tel:${content.phone}`}>Call {content.phone}</a> : null}
          {content.email ? <a className="border-2 border-[var(--demo-primary)] px-7 py-4 text-center font-black uppercase tracking-[0.16em] text-[var(--demo-on-accent)] transition hover:bg-[var(--demo-primary)] hover:text-[var(--demo-on-primary)]" href={`mailto:${content.email}`}>{content.contactCta.buttonLabel}</a> : null}
        </div>
      </div>
    </section>
  )
}
