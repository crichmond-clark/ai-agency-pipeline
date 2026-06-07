import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoServices({ content }: DemoSectionProps) {
  return (
    <section className="border-b border-[var(--demo-border)] bg-[var(--demo-surface)]" id="services">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--demo-accent)]">Services</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[var(--demo-primary)] md:text-5xl">What customers can call about</h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-[var(--demo-muted)]">
            For repairs, planned work, or practical enquiries, the services below outline common ways to get help from {content.businessName}.
          </p>
        </div>

        <div className="mt-12 border-t border-[var(--demo-border)]">
          {content.services.map((service, index) => (
            <article className="grid gap-5 border-b border-[var(--demo-border)] py-8 md:grid-cols-[6rem_0.7fr_1fr] md:items-start" key={`${service.title}-${index}`}>
              <span className="font-mono text-sm font-bold text-[var(--demo-accent)]">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="text-2xl font-black tracking-[-0.04em] text-[var(--demo-primary)]">{service.title}</h3>
              <p className="text-lg leading-8 text-[var(--demo-muted)]">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
