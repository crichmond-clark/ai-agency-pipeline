export class BoundedFormDataError extends Error {
  constructor(readonly status: 400 | 413 | 415, message: string) {
    super(message)
  }
}

export async function readBoundedFormData(request: Request, maxBytes: number): Promise<FormData> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'multipart/form-data') throw new BoundedFormDataError(415, 'Content-Type must be multipart/form-data')

  const contentLength = request.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    throw new BoundedFormDataError(413, 'Request body is too large')
  }
  if (!request.body) throw new BoundedFormDataError(400, 'Request body is required')

  let bytesRead = 0
  let exceededLimit = false
  const boundedBody = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytesRead += chunk.byteLength
      if (bytesRead > maxBytes) {
        exceededLimit = true
        throw new Error('Request body is too large')
      }
      controller.enqueue(chunk)
    },
  }))
  const headers = new Headers(request.headers)
  headers.delete('content-length')

  try {
    const boundedRequest = new Request(request.url, {
      method: 'POST',
      headers,
      body: boundedBody,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })
    return await boundedRequest.formData()
  } catch {
    if (exceededLimit) throw new BoundedFormDataError(413, 'Request body is too large')
    throw new BoundedFormDataError(400, 'Invalid multipart form')
  }
}
