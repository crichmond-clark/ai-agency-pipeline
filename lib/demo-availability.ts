export type DemoAvailabilityFields = {
  is_public?: boolean | null
  removed_at?: string | null
  expires_at?: string | null
}

export function isDemoSiteAvailable(demoSite: unknown, now = new Date()): boolean {
  return getDemoAvailabilityBlockReason(demoSite, now) === null
}

export function getDemoAvailabilityBlockReason(demoSite: unknown, now = new Date()): string | null {
  const availability = toDemoAvailabilityFields(demoSite)
  if (!availability) return 'Available public demo site is required'
  if (availability.is_public !== true) return 'Demo site is not public'
  if (availability.removed_at) return 'Demo site has been removed'
  if (availability.expires_at && isExpired(availability.expires_at, now)) return 'Demo site has expired'
  return null
}

function toDemoAvailabilityFields(demoSite: unknown): DemoAvailabilityFields | null {
  if (!demoSite || typeof demoSite !== 'object') return null
  const fields = demoSite as DemoAvailabilityFields
  return {
    is_public: fields.is_public,
    removed_at: fields.removed_at,
    expires_at: fields.expires_at,
  }
}

function isExpired(expiresAt: string, now: Date): boolean {
  const expires = new Date(expiresAt)
  if (Number.isNaN(expires.getTime())) return true
  return expires.getTime() <= now.getTime()
}
