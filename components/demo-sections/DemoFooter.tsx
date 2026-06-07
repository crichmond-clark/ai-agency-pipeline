import type { DemoSectionProps } from '@/components/demo-renderer/types'

export function DemoFooter({ content }: DemoSectionProps) {
  return (
    <footer className="border-t border-[var(--demo-border)] bg-[var(--demo-surface)] px-5 py-8 text-sm leading-6 text-[var(--demo-muted)] lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="font-black tracking-[-0.03em] text-[var(--demo-primary)]">{content.businessName}</p>
        <p className="max-w-3xl md:text-right">{content.footerDisclaimer}</p>
      </div>
    </footer>
  )
}
