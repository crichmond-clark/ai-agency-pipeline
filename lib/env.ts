export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

/** Keeps node-postgres on its current certificate-verifying interpretation. */
export function normalizeDatabaseUri(uri: string): string {
  return uri.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=(&|$))/i, '$1verify-full')
}
