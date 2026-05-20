import Link from 'next/link'
import type { ReactNode } from 'react'

export function AppShell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#121212] text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-400">
          <Link className="text-zinc-50 hover:text-blue-400" href="/">Pipeline</Link>
          <Link className="hover:text-blue-400" href="/dashboard/leads">Leads</Link>
          <Link className="hover:text-blue-400" href="/admin">Payload admin</Link>
        </nav>
        <header className="flex flex-col gap-4 rounded-3xl border border-zinc-700/80 bg-[#1e1e1e] p-6 shadow-2xl shadow-black/30 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">AI agency pipeline</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  )
}
