import { chromium, type ViewportSize } from 'playwright'

type ScreenshotResult = {
  dataUrl: string
  capturedAt: string
  viewport: ViewportSize
}

export async function captureDemoScreenshots(url: string): Promise<{ desktop: ScreenshotResult; mobile: ScreenshotResult }> {
  const browser = await chromium.launch({ headless: true })
  try {
    const [desktop, mobile] = await Promise.all([
      captureViewport(browser, url, { width: 1440, height: 1000 }),
      captureViewport(browser, url, { width: 390, height: 844 }),
    ])
    return { desktop, mobile }
  } finally {
    await browser.close()
  }
}

async function captureViewport(browser: Awaited<ReturnType<typeof chromium.launch>>, url: string, viewport: ViewportSize): Promise<ScreenshotResult> {
  const page = await browser.newPage({ viewport })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
  const buffer = await page.screenshot({ fullPage: true, type: 'png' })
  await page.close()

  return {
    dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
    capturedAt: new Date().toISOString(),
    viewport,
  }
}
