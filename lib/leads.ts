import type { Payload } from 'payload'

import type { CsvRow } from './csv'

const websiteStatuses = ['no_site', 'social_only', 'third_party_platform', 'broken', 'live', 'unknown'] as const
type WebsiteStatus = (typeof websiteStatuses)[number]

type ImportResult = { created: number; updated: number }

export async function importBusinessFinderRows(payload: Payload, rows: CsvRow[]): Promise<ImportResult> {
  let created = 0
  let updated = 0

  for (const row of rows) {
    const data = mapLeadRow(row)
    const existingId = await findExistingLeadId(payload, data.google_place_id, data.normalized_business_name, data.city)

    if (existingId) {
      await payload.update({ collection: 'leads', id: existingId, data: sourceUpdateData(row, data) })
      updated += 1
    } else {
      await payload.create({ collection: 'leads', draft: false, data: { ...data, source_payload: row, source_imported_at: new Date().toISOString() } })
      created += 1
    }
  }

  return { created, updated }
}

function mapLeadRow(row: CsvRow) {
  const businessName = pick(row, 'business_name', 'name', 'title')
  const city = pick(row, 'city', 'town')
  const normalizedBusinessName = businessName.trim().toLowerCase().replace(/\s+/g, ' ')
  const websiteStatus = pick(row, 'website_status')

  return {
    business_name: businessName,
    normalized_business_name: normalizedBusinessName,
    city,
    address: pick(row, 'address', 'formatted_address'),
    phone: pick(row, 'phone', 'phone_number'),
    email: pick(row, 'email'),
    website_url: pick(row, 'website', 'website_url', 'url'),
    google_place_id: pick(row, 'place_id', 'google_place_id') || undefined,
    lead_source: 'business-finder-csv',
    website_status: isWebsiteStatus(websiteStatus) ? websiteStatus : 'unknown',
    pipeline_status: 'new' as const,
    sales_status: 'not_contacted' as const,
  }
}

function isWebsiteStatus(value: string): value is WebsiteStatus {
  return (websiteStatuses as readonly string[]).includes(value)
}

function sourceUpdateData(row: CsvRow, data: ReturnType<typeof mapLeadRow>) {
  return {
    address: data.address,
    phone: data.phone,
    email: data.email,
    website_url: data.website_url,
    lead_source: data.lead_source,
    source_payload: row,
    source_imported_at: new Date().toISOString(),
    website_status: data.website_status,
  }
}

async function findExistingLeadId(payload: Payload, googlePlaceId?: string, normalizedBusinessName?: string, city?: string) {
  if (googlePlaceId) {
    const result = await payload.find({ collection: 'leads', where: { google_place_id: { equals: googlePlaceId } }, limit: 1 })
    if (result.docs[0]?.id) return result.docs[0].id
  }

  if (!normalizedBusinessName || !city) return undefined

  const result = await payload.find({
    collection: 'leads',
    where: { and: [{ normalized_business_name: { equals: normalizedBusinessName } }, { city: { equals: city } }] },
    limit: 1,
  })
  return result.docs[0]?.id
}

function pick(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }
  return ''
}
