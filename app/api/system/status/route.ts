import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { getSystemStatus } from '@/lib/system-status'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return Response.json(await getSystemStatus())
}
