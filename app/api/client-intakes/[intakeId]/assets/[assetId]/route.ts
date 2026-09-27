import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { getIntakeAsset, type StoredIntakeAsset } from '@/lib/client-intake-assets'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(request: Request, { params }: { params: Promise<{ intakeId: string; assetId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_HEADERS })

  const { intakeId, assetId } = await params
  let intake
  try {
    intake = await payload.findByID({ collection: 'client-intakes', id: intakeId, depth: 0, overrideAccess: true })
  } catch {
    return Response.json({ error: 'Asset not found' }, { status: 404, headers: PRIVATE_HEADERS })
  }

  const storedAssets = (intake as unknown as { assets?: unknown }).assets
  const assets = Array.isArray(storedAssets) ? storedAssets as StoredIntakeAsset[] : []
  const asset = assets.find((entry) => entry && entry.id === assetId)
  const safeMimeType = asset?.mimeType
  if (
    !asset ||
    typeof asset.key !== 'string' ||
    !asset.key.startsWith(`client-intakes/${encodeURIComponent(String(intake.id))}/`) ||
    typeof safeMimeType !== 'string' ||
    !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(safeMimeType) ||
    !Number.isSafeInteger(asset.byteLength) ||
    asset.byteLength <= 0
  ) {
    return Response.json({ error: 'Asset not found' }, { status: 404, headers: PRIVATE_HEADERS })
  }

  try {
    const object = await getIntakeAsset(asset.key)
    if (!object?.body) return Response.json({ error: 'Asset not found' }, { status: 404, headers: PRIVATE_HEADERS })
    const filename = typeof asset.originalFilename === 'string' ? asset.originalFilename : 'intake-asset'
    const safeFilename = filename.replace(/[\r\n"\\]/g, '_')
    const headers = new Headers(PRIVATE_HEADERS)
    headers.set('Content-Type', asset.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${safeFilename.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`)
    headers.set('Content-Length', String(asset.byteLength))
    return new Response(object.body, { status: 200, headers })
  } catch {
    return Response.json({ error: 'Asset unavailable' }, { status: 502, headers: PRIVATE_HEADERS })
  }
}
