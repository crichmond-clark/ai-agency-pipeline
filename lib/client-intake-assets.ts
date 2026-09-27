import { AwsClient } from 'aws4fetch'

export const MAX_INTAKE_ASSETS = 5
export const MAX_INTAKE_ASSET_BYTES = 10 * 1024 * 1024
export const MAX_INTAKE_ASSET_TOTAL_BYTES = 50 * 1024 * 1024

export type StoredIntakeAsset = {
  id: string
  key: string
  originalFilename: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
  byteLength: number
  uploadedAt: string
}

const allowedMimeTypes: Record<StoredIntakeAsset['mimeType'], true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'application/pdf': true,
}

export function assertIntakeAssetStorageConfigured(): void {
  requiredEnv('R2_ACCOUNT_ID')
  requiredEnv('R2_ACCESS_KEY_ID')
  requiredEnv('R2_SECRET_ACCESS_KEY')
  const intakeBucket = requiredEnv('INTAKE_R2_BUCKET')
  const publicBucket = process.env.R2_BUCKET
  if (publicBucket && intakeBucket === publicBucket) throw new Error('Intake assets must use a private bucket distinct from the public bucket')
}

export async function uploadIntakeAssets(intakeId: string, files: File[]): Promise<StoredIntakeAsset[]> {
  assertIntakeAssetStorageConfigured()
  if (!intakeId || intakeId.includes('/') || intakeId.includes('\\')) throw new Error('Invalid intake ID')
  validateFileLimits(files)
  const mimeTypes = await Promise.all(files.map(validateFile))
  const client = createR2Client()
  const uploaded: StoredIntakeAsset[] = []
  try {
    for (const [index, file] of files.entries()) {
      const mimeType = mimeTypes[index]
      const key = `client-intakes/${encodeURIComponent(intakeId)}/${crypto.randomUUID()}`
      const asset: StoredIntakeAsset = {
        id: crypto.randomUUID(),
        key,
        originalFilename: file.name,
        mimeType,
        byteLength: file.size,
        uploadedAt: new Date().toISOString(),
      }
      uploaded.push(asset)
      const response = await client.fetch(objectUrl(key), {
        method: 'PUT',
        headers: { 'content-type': mimeType },
        body: await file.arrayBuffer(),
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw new Error(`Private intake asset upload failed (${response.status})`)
      }
    }
    return uploaded
  } catch (error) {
    await deleteIntakeAssets(uploaded)
    throw error
  }
}

export async function deleteIntakeAssets(assets: readonly Pick<StoredIntakeAsset, 'key'>[]): Promise<void> {
  if (assets.length === 0) return
  let client: AwsClient
  try {
    assertIntakeAssetStorageConfigured()
    client = createR2Client()
  } catch {
    for (const asset of assets) console.error('Private intake asset cleanup failed', { key: asset.key })
    return
  }
  for (const asset of assets) {
    try {
      const response = await client.fetch(objectUrl(asset.key), { method: 'DELETE' })
      if (!response.ok) {
        await response.body?.cancel()
        console.error('Private intake asset cleanup failed', { key: asset.key })
      }
    } catch {
      console.error('Private intake asset cleanup failed', { key: asset.key })
    }
  }
}

export async function getIntakeAsset(key: string): Promise<Response | null> {
  assertIntakeAssetStorageConfigured()
  const response = await createR2Client().fetch(objectUrl(key))
  if (response.status === 404) {
    await response.body?.cancel()
    return null
  }
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`Private intake asset read failed (${response.status})`)
  }
  return response
}

function validateFileLimits(files: File[]): void {
  if (files.length > MAX_INTAKE_ASSETS) throw new Error('Too many intake assets')
  let totalBytes = 0
  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_INTAKE_ASSET_BYTES) throw new Error('Invalid intake asset size')
    totalBytes += file.size
  }
  if (totalBytes > MAX_INTAKE_ASSET_TOTAL_BYTES) throw new Error('Intake assets exceed total size limit')
}

async function validateFile(file: File): Promise<StoredIntakeAsset['mimeType']> {
  const declaredType = file.type as StoredIntakeAsset['mimeType']
  if (!allowedMimeTypes[declaredType]) throw new Error('Unsupported intake asset type')
  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const valid = declaredType === 'image/jpeg'
    ? signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
    : declaredType === 'image/png'
      ? signature.length >= 8 && signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a && signature[6] === 0x1a && signature[7] === 0x0a
      : declaredType === 'image/webp'
        ? signature.length >= 12 && ascii(signature, 0, 4) === 'RIFF' && ascii(signature, 8, 12) === 'WEBP'
        : signature.length >= 5 && ascii(signature, 0, 5) === '%PDF-'
  if (!valid) throw new Error('Intake asset signature does not match its MIME type')
  return declaredType
}

function createR2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    service: 's3',
    region: 'auto',
  })
}

function objectUrl(key: string): string {
  const accountId = requiredEnv('R2_ACCOUNT_ID')
  const bucket = requiredEnv('INTAKE_R2_BUCKET')
  const encodedKey = key.split('/').map(encodeURIComponent).join('/')
  return `https://${accountId}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}/${encodedKey}`
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for private intake asset storage`)
  return value
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end))
}
