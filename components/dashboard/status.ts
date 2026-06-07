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
  ready: 'Ready',
  blocked: 'Blocked',
  complete: 'Complete',
  configured: 'Configured',
  missing: 'Missing',
  public: 'Public',
  private: 'Private',
}

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'

export function statusLabel(value: string | boolean | null | undefined) {
  if (typeof value === 'boolean') return value ? 'Approved' : 'Not approved'
  if (!value) return 'Unknown'
  return labels[value] ?? value.replaceAll('_', ' ')
}

export function statusVariant(value: string | boolean | null | undefined): StatusVariant {
  if (value === true) return 'success'
  if (value === false || !value) return 'secondary'

  const variants: Record<string, StatusVariant> = {
    new: 'secondary',
    profile_ready: 'default',
    demo_content_ready: 'info',
    demo_ready: 'purple',
    qa_failed: 'destructive',
    needs_review: 'warning',
    approved: 'success',
    rejected: 'destructive',
    not_contacted: 'secondary',
    contacted: 'default',
    replied: 'info',
    call_booked: 'purple',
    won: 'success',
    lost: 'destructive',
    succeeded: 'success',
    failed: 'destructive',
    running: 'warning',
    do_not_contact: 'destructive',
    contact_allowed: 'success',
    ready: 'success',
    blocked: 'secondary',
    complete: 'success',
    configured: 'success',
    missing: 'secondary',
    public: 'success',
    private: 'secondary',
  }

  return variants[value] ?? 'outline'
}
