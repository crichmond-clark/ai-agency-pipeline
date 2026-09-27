import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { findAvailableClientIntake, type AvailableClientIntake } from '@/lib/client-intake'

import { ClientIntakeForm } from './ClientIntakeForm'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Private Client Intake',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

type PageProps = { params: Promise<{ token: string }> }

export default async function ClientIntakePage({ params }: PageProps) {
  const { token } = await params
  let available: AvailableClientIntake | null = null
  try {
    const payload = await getPayload({ config })
    available = await findAvailableClientIntake(payload, token)
  } catch {
    available = null
  }

  if (!available) return <UnavailablePage />

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 sm:py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Private client intake</p>
        <h1 className="text-3xl font-semibold tracking-tight">Website content questionnaire</h1>
        <p className="text-muted-foreground">Please review and correct source-provided details, then tell us what should appear on your website. Your answers are submitted for owner review and are not treated as verified facts.</p>
      </header>
      <ClientIntakeForm token={token} prefill={available.prefill} />
    </main>
  )
}

function UnavailablePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Private client intake</p>
      <h1 className="text-3xl font-semibold tracking-tight">This invitation is unavailable</h1>
      <p className="text-muted-foreground">This link may have expired, been replaced, or already been used. Contact the person who invited you if you need help.</p>
    </main>
  )
}
