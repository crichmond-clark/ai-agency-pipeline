import type { SystemStatus } from '@/components/dashboard/SystemReadinessCard'

export async function getSystemStatus(): Promise<SystemStatus> {
  const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'
  return {
    appUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
    portfolioMode: process.env.PORTFOLIO_MODE === 'true',
    aiServiceConfigured: Boolean(process.env.AI_SERVICE_TOKEN),
    aiServiceReachable: await checkAiService(aiServiceUrl),
    aiProvider: process.env.AI_PROVIDER ?? 'deterministic',
    databaseConfigured: Boolean(process.env.DATABASE_URI),
    r2Configured: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL),
    resendConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
  }
}

async function checkAiService(aiServiceUrl: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)
  try {
    const response = await fetch(`${aiServiceUrl}/health`, { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
