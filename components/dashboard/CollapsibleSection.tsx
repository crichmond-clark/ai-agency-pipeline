import type { ReactNode } from 'react'

import { ChevronDown } from 'lucide-react'

export function CollapsibleSection({ title, description, children, defaultOpen = true }: { title: string; description?: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border bg-card/50 p-1 shadow-sm" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg p-4 marker:hidden hover:bg-muted/50">
        <span>
          <span className="block font-semibold">{title}</span>
          {description ? <span className="mt-1 block text-sm text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="p-3 pt-0">{children}</div>
    </details>
  )
}
