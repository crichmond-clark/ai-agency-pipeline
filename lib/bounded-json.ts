export class BoundedJsonError extends Error {
  constructor(readonly status: 400 | 413 | 415, message: string) {
    super(message)
  }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') throw new BoundedJsonError(415, 'Content-Type must be application/json')

  const contentLength = request.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    throw new BoundedJsonError(413, 'Request body is too large')
  }
  if (!request.body) throw new BoundedJsonError(400, 'Request body is required')

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new BoundedJsonError(413, 'Request body is too large')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown
  } catch {
    throw new BoundedJsonError(400, 'Invalid JSON')
  }
}
