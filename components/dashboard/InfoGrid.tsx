import type { ReactNode } from 'react'

export function InfoGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4" key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-zinc-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
