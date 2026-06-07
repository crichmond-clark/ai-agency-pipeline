import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/theme-toggle'
import { ButtonLink } from '@/components/ui/button'

export function AppShell({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link className="font-semibold text-foreground" href="/">Pipeline</Link>
            <span>/</span>
            <Link className="hover:text-foreground" href="/dashboard/leads">Leads</Link>
            <span>/</span>
            <Link className="hover:text-foreground" href="/admin">Payload admin</Link>
          </div>
          <ThemeToggle />
        </nav>
        <header className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">AI agency pipeline</p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
              {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {actions}
              <ButtonLink href="/admin" variant="outline">Payload admin</ButtonLink>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
