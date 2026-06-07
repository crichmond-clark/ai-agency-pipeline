import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoProcess({ content }: DemoSectionProps) {
  return (
    <section className="border-b border-[var(--demo-border)] bg-[var(--demo-bg)]">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--demo-accent)]">Next steps</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[var(--demo-primary)] md:text-5xl">Simple ways to get help</h2>
          </div>
          <div className="grid border-t border-[var(--demo-border)] md:grid-cols-3 md:border-l md:border-t-0">
            {content.processSteps.map((step, index) => (
              <div className="border-b border-[var(--demo-border)] py-7 md:border-b-0 md:border-r md:px-7" key={step.title}>
                <span className="font-mono text-sm font-bold text-[var(--demo-accent)]">0{index + 1}</span>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--demo-primary)]">{step.title}</h3>
                <p className="mt-4 leading-7 text-[var(--demo-muted)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
