import { sql } from '@payloadcms/db-postgres'
import config from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

import { BoundedFormDataError, readBoundedFormData } from '@/lib/bounded-form-data'
import { buildStoredClientIntakeAnswers, ClientIntakeSubmissionSchema, findAvailableClientIntake, hashClientIntakeToken, isLeadEligibleForClientIntake, type AvailableClientIntake } from '@/lib/client-intake'
import { assertIntakeAssetStorageConfigured, deleteIntakeAssets, MAX_INTAKE_ASSET_BYTES, MAX_INTAKE_ASSET_TOTAL_BYTES, MAX_INTAKE_ASSETS, type StoredIntakeAsset, uploadIntakeAssets } from '@/lib/client-intake-assets'
import { recordWorkflowRun } from '@/lib/workflow'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}
const MAX_REQUEST_BYTES = MAX_INTAKE_ASSET_TOTAL_BYTES + 2 * 1024 * 1024
const allowedAssetTypes: Record<string, true> = { 'image/jpeg': true, 'image/png': true, 'image/webp': true, 'application/pdf': true }
const submissionSchema = z.object({
  token: z.string().max(128),
  answers: ClientIntakeSubmissionSchema,
}).strict()
type IntakeAssetMetadata = StoredIntakeAsset

const unavailableResponse = () => Response.json({ error: 'This invitation is unavailable' }, { status: 404, headers: PRIVATE_HEADERS })

async function deleteUploadedAssets(assets: IntakeAssetMetadata[]) {
  if (assets.length === 0) return
  try {
    await deleteIntakeAssets(assets)
  } catch {
    console.error('Private intake asset cleanup failed', assets.map((asset) => asset.key))
  }
}

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await readBoundedFormData(request, MAX_REQUEST_BYTES)
  } catch (error) {
    const status = error instanceof BoundedFormDataError ? error.status : 400
    return Response.json({ error: 'Invalid submission' }, { status, headers: PRIVATE_HEADERS })
  }

  for (const key of form.keys()) {
    if (key !== 'token' && key !== 'answers' && key !== 'assets') {
      return Response.json({ error: 'Invalid submission' }, { status: 400, headers: PRIVATE_HEADERS })
    }
  }
  const tokenFields = form.getAll('token')
  const answerFields = form.getAll('answers')
  if (tokenFields.length !== 1 || answerFields.length !== 1 || typeof tokenFields[0] !== 'string' || typeof answerFields[0] !== 'string') {
    return Response.json({ error: 'Invalid submission' }, { status: 400, headers: PRIVATE_HEADERS })
  }
  if (Buffer.byteLength(answerFields[0], 'utf8') > 64 * 1024) {
    return Response.json({ error: 'Invalid submission' }, { status: 413, headers: PRIVATE_HEADERS })
  }

  let answers: unknown
  try {
    answers = JSON.parse(answerFields[0]) as unknown
  } catch {
    return Response.json({ error: 'Invalid submission' }, { status: 400, headers: PRIVATE_HEADERS })
  }
  const parsedBody = submissionSchema.safeParse({ token: tokenFields[0], answers })
  if (!parsedBody.success) return Response.json({ error: 'Invalid submission' }, { status: 400, headers: PRIVATE_HEADERS })

  const files: File[] = []
  let totalAssetBytes = 0
  for (const value of form.getAll('assets')) {
    if (typeof value === 'string') return Response.json({ error: 'Invalid submission' }, { status: 400, headers: PRIVATE_HEADERS })
    if (value.size === 0 && value.name === '') continue
    if (value.size > MAX_INTAKE_ASSET_BYTES || !allowedAssetTypes[value.type.toLowerCase()]) {
      return Response.json({ error: 'An uploaded file is not supported' }, { status: 413, headers: PRIVATE_HEADERS })
    }
    totalAssetBytes += value.size
    if (totalAssetBytes > MAX_INTAKE_ASSET_TOTAL_BYTES) {
      return Response.json({ error: 'Uploaded files exceed the allowed total size' }, { status: 413, headers: PRIVATE_HEADERS })
    }
    files.push(value)
    if (files.length > MAX_INTAKE_ASSETS) {
      return Response.json({ error: 'Too many files were supplied' }, { status: 413, headers: PRIVATE_HEADERS })
    }
  }

  const tokenHash = hashClientIntakeToken(parsedBody.data.token)
  if (!tokenHash) return unavailableResponse()

  const payload = await getPayload({ config })
  let available: AvailableClientIntake | null = null
  try {
    available = await findAvailableClientIntake(payload, parsedBody.data.token)
  } catch {
    return unavailableResponse()
  }
  if (!available) return unavailableResponse()

  try {
    assertIntakeAssetStorageConfigured()
  } catch {
    return Response.json({ error: 'Private intake storage is unavailable' }, { status: 503, headers: PRIVATE_HEADERS })
  }

  let uploadedAssets: IntakeAssetMetadata[] = []
  try {
    uploadedAssets = await uploadIntakeAssets(String(available.intakeId), files)
  } catch {
    return Response.json({ error: 'Uploaded files could not be accepted' }, { status: 400, headers: PRIVATE_HEADERS })
  }

  let latestAvailable: AvailableClientIntake | null = null
  try {
    latestAvailable = await findAvailableClientIntake(payload, parsedBody.data.token)
  } catch {
    await deleteUploadedAssets(uploadedAssets)
    return unavailableResponse()
  }
  if (!latestAvailable || latestAvailable.intakeId !== available.intakeId || latestAvailable.leadId !== available.leadId) {
    await deleteUploadedAssets(uploadedAssets)
    return unavailableResponse()
  }

  let currentLead
  try {
    currentLead = await payload.findByID({
      collection: 'leads',
      id: latestAvailable.leadId,
      depth: 0,
      select: { email: true, qualification_status: true, sales_status: true, do_not_contact_at: true, is_sample_lead: true },
      overrideAccess: true,
    })
  } catch {
    await deleteUploadedAssets(uploadedAssets)
    return unavailableResponse()
  }
  if (!isLeadEligibleForClientIntake(currentLead)) {
    await deleteUploadedAssets(uploadedAssets)
    return unavailableResponse()
  }

  const submittedAt = new Date().toISOString()
  const stored = buildStoredClientIntakeAnswers(parsedBody.data.answers, latestAvailable.prefill, submittedAt)
  let result
  try {
    result = await payload.db.execute({
      drizzle: payload.db.drizzle,
      sql: sql`UPDATE "client_intakes"
        SET "status" = 'submitted',
            "active_lead_id" = NULL,
            "token_hash" = NULL,
            "submitted_at" = ${submittedAt},
            "answers" = ${JSON.stringify(stored.answers)}::jsonb,
            "verification_flags" = ${JSON.stringify(stored.verificationFlags)}::jsonb,
            "assets" = ${JSON.stringify(uploadedAssets)}::jsonb,
            "updated_at" = ${submittedAt}
        WHERE "id" = ${latestAvailable.intakeId}
          AND "lead_id" = ${latestAvailable.leadId}
          AND "active_lead_id" = ${latestAvailable.leadId}
          AND "token_hash" = ${tokenHash}
          AND "status" = 'invited'
          AND "expires_at" > ${submittedAt}
        RETURNING "id"`,
    })
  } catch {
    await deleteUploadedAssets(uploadedAssets)
    return Response.json({ error: 'Unable to process this submission right now' }, { status: 503, headers: PRIVATE_HEADERS })
  }

  if (!('rows' in result) || !result.rows || result.rows.length !== 1) {
    await deleteUploadedAssets(uploadedAssets)
    return unavailableResponse()
  }

  await recordWorkflowRun(payload, {
    operation: 'client_intake_submission',
    status: 'succeeded',
    lead: latestAvailable.leadId,
    started_at: submittedAt,
    summary: 'Client intake submission received and pending owner review',
  }).catch(() => undefined)

  return Response.json({ submitted: true }, { headers: PRIVATE_HEADERS })
}
