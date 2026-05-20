const labels: Record<string, string> = {
  new: 'New',
  profile_ready: 'Profile ready',
  demo_content_ready: 'Content ready',
  demo_ready: 'Demo ready',
  qa_failed: 'QA failed',
  needs_review: 'Needs review',
  approved: 'Approved',
  rejected: 'Rejected',
  not_contacted: 'Not contacted',
  contacted: 'Contacted',
  replied: 'Replied',
  call_booked: 'Call booked',
  won: 'Won',
  lost: 'Lost',
  succeeded: 'Succeeded',
  failed: 'Failed',
  running: 'Running',
  do_not_contact: 'Do not contact',
  contact_allowed: 'Allowed',
}

type StatusVariant = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple' | 'cyan'

export function statusLabel(value: string | boolean | null | undefined) {
  if (typeof value === 'boolean') return value ? 'Approved' : 'Not approved'
  if (!value) return 'Unknown'
  return labels[value] ?? value.replaceAll('_', ' ')
}

export function statusVariant(value: string | boolean | null | undefined): StatusVariant {
  if (value === true) return 'green'
  if (value === false || !value) return 'neutral'

  const variants: Record<string, StatusVariant> = {
    new: 'neutral',
    profile_ready: 'blue',
    demo_content_ready: 'cyan',
    demo_ready: 'purple',
    qa_failed: 'red',
    needs_review: 'amber',
    approved: 'green',
    rejected: 'red',
    not_contacted: 'neutral',
    contacted: 'blue',
    replied: 'cyan',
    call_booked: 'purple',
    won: 'green',
    lost: 'red',
    succeeded: 'green',
    failed: 'red',
    running: 'amber',
    do_not_contact: 'red',
    contact_allowed: 'green',
  }

  return variants[value] ?? 'slate'
}
