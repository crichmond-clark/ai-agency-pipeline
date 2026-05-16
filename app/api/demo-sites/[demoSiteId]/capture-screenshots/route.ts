import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { isR2Configured, uploadBufferToR2 } from '@/lib/r2-storage'
import { captureDemoScreenshots } from '@/lib/screenshots'
import { recordWorkflowRun } from '@/lib/workflow'

export async function POST(request: Request, { params }: { params: Promise<{ demoSiteId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { demoSiteId } = await params
  const startedAt = new Date().toISOString()

  try {
    const demoSite = await payload.findByID({ collection: 'demo-sites', id: demoSiteId })
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? new URL(request.url).origin
    if (!isR2Configured()) return Response.json({ error: 'Cloudflare R2 storage is not configured' }, { status: 500 })

    const screenshots = await captureDemoScreenshots(`${baseUrl}/demo/${demoSite.slug}`)
    const capturedAt = new Date().toISOString()
    const [desktop, mobile] = await Promise.all([
      uploadBufferToR2({ key: `demo-sites/${demoSite.slug}/screenshots/desktop-${Date.now()}.png`, buffer: screenshots.desktop.buffer, contentType: screenshots.desktop.contentType }),
      uploadBufferToR2({ key: `demo-sites/${demoSite.slug}/screenshots/mobile-${Date.now()}.png`, buffer: screenshots.mobile.buffer, contentType: screenshots.mobile.contentType }),
    ])
    const screenshotReport = {
      desktop: { ...desktop, capturedAt, viewport: screenshots.desktop.viewport },
      mobile: { ...mobile, capturedAt, viewport: screenshots.mobile.viewport },
    }
    const updatedDemoSite = await payload.update({
      collection: 'demo-sites',
      id: demoSite.id,
      data: { qa_report: { ...(typeof demoSite.qa_report === 'object' && demoSite.qa_report ? demoSite.qa_report : {}), screenshots: screenshotReport } },
    })

    await recordWorkflowRun(payload, { operation: 'screenshot_capture', status: 'succeeded', lead: typeof demoSite.lead === 'object' ? demoSite.lead.id : demoSite.lead, demo_site: demoSite.id, started_at: startedAt, summary: 'Captured desktop and mobile screenshots to Cloudflare R2', metadata: { screenshots: screenshotReport } })
    return Response.json({ demo_site: updatedDemoSite, screenshots: screenshotReport })
  } catch (error) {
    await recordWorkflowRun(payload, { operation: 'screenshot_capture', status: 'failed', demo_site: demoSiteId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown screenshot error' })
    return Response.json({ error: 'Screenshot capture failed' }, { status: 400 })
  }
}
