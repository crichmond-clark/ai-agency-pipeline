import { timingSafeEqual } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import { ingestWebsiteEnquiry } from '@/lib/website-enquiries'
import { z } from 'zod'

const maxBodyBytes = 16 * 1024

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({ error: 'JSON is required' }, { status: 415 })
  const secret = process.env.WEBSITE_INGEST_TOKEN
  const authorization = request.headers.get('authorization') ?? ''
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBodyBytes) return Response.json({ error: 'Request too large' }, { status: 413 })
  const reader = request.body?.getReader()
  if (!reader) return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBodyBytes) { await reader.cancel(); return Response.json({ error: 'Request too large' }, { status: 413 }) }
    chunks.push(value)
  }
  let input: unknown
  try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const payload = await getPayload({ config })
  try {
    const result = await ingestWebsiteEnquiry(payload, input)
    return Response.json({ leadId: result.leadId }, { status: result.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'submission_conflict') return Response.json({ error: 'Submission ID conflicts with existing data' }, { status: 409 })
    if (error instanceof z.ZodError) return Response.json({ error: 'Invalid enquiry' }, { status: 400 })
    return Response.json({ error: 'Unable to process enquiry' }, { status: 500 })
  }
}
