import type { AccessArgs } from 'payload'

export function authenticated({ req }: AccessArgs): boolean {
  return Boolean(req.user)
}
