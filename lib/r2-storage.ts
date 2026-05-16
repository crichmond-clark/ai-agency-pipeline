import { AwsClient } from 'aws4fetch'

export type StoredObject = {
  key: string
  url: string
  contentType: string
  size: number
}

export function isR2Configured(): boolean {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL)
}

export async function uploadBufferToR2(input: { key: string; buffer: Buffer; contentType: string }): Promise<StoredObject> {
  const accountId = requiredEnv('R2_ACCOUNT_ID')
  const bucket = requiredEnv('R2_BUCKET')
  const publicBaseUrl = requiredEnv('R2_PUBLIC_BASE_URL').replace(/\/$/, '')
  const client = new AwsClient({
    accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    service: 's3',
    region: 'auto',
  })

  const encodedKey = input.key.split('/').map(encodeURIComponent).join('/')
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodedKey}`
  const response = await client.fetch(url, {
    method: 'PUT',
    headers: { 'content-type': input.contentType },
    body: new Uint8Array(input.buffer),
  })

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status} ${await response.text()}`)
  }

  return {
    key: input.key,
    url: `${publicBaseUrl}/${encodedKey}`,
    contentType: input.contentType,
    size: input.buffer.byteLength,
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for R2 storage`)
  return value
}
