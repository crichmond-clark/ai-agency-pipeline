import { describe, expect, it } from 'vitest'

import { buildStoredClientIntakeAnswers, ClientIntakeSubmissionSchema, createClientIntakeToken, hashClientIntakeToken, isLeadEligibleForClientIntake } from '@/lib/client-intake'

const eligibleLead = { id: 1, qualification_status: 'qualified', sales_status: 'not_contacted', email: 'owner@example.test', is_sample_lead: false }
const validAnswers = {
  businessName: 'Example Services',
  contactName: 'Casey Owner',
  businessNameConfirmed: true,
  contactEmail: 'owner@example.test',
  contactEmailConfirmed: true,
  phone: '',
  website: '',
  address: '',
  city: '',
  businessDescription: '',
  services: [{ name: 'Repairs', description: 'Domestic repair work' }],
  servicesConfirmed: true,
  serviceAreas: '',
  intendedAudience: '',
  primaryGoal: 'Receive more enquiries',
  brandGuidance: '',
  suppliedCopy: '',
  claims: [],
  externalAssetLinks: [],
  unanswered: [],
}

describe('private client intake contracts', () => {
  it('creates 32-byte bearer tokens and rejects malformed encodings', () => {
    const token = createClientIntakeToken()
    expect(Buffer.from(token, 'base64url').byteLength).toBe(32)
    expect(hashClientIntakeToken(token)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashClientIntakeToken('invalid')).toBeNull()
    expect(hashClientIntakeToken(`${token}=`)).toBeNull()
  })

  it('requires a qualified, contactable non-sample lead', () => {
    expect(isLeadEligibleForClientIntake(eligibleLead)).toBe(true)
    expect(isLeadEligibleForClientIntake({ ...eligibleLead, sales_status: 'lost' })).toBe(false)
    expect(isLeadEligibleForClientIntake({ ...eligibleLead, do_not_contact_at: '2026-01-01' })).toBe(false)
    expect(isLeadEligibleForClientIntake({ ...eligibleLead, is_sample_lead: true })).toBe(false)
    expect(isLeadEligibleForClientIntake({ ...eligibleLead, qualification_status: 'unreviewed' })).toBe(false)
  })

  it('requires confirmations, one valid service, reachable email, and primary goal', () => {
    expect(ClientIntakeSubmissionSchema.safeParse(validAnswers).success).toBe(true)
    expect(ClientIntakeSubmissionSchema.safeParse({ ...validAnswers, services: [] }).success).toBe(false)
    expect(ClientIntakeSubmissionSchema.safeParse({ ...validAnswers, contactEmail: 'not-an-email' }).success).toBe(false)
    expect(ClientIntakeSubmissionSchema.safeParse({ ...validAnswers, primaryGoal: '' }).success).toBe(false)
    expect(ClientIntakeSubmissionSchema.safeParse({ ...validAnswers, businessNameConfirmed: false }).success).toBe(false)
  })
  it('persists submitted business description for owner review', () => {
    const submission = ClientIntakeSubmissionSchema.parse({ ...validAnswers, businessDescription: 'Family-owned repair service serving the region.' })
    const stored = buildStoredClientIntakeAnswers(submission, {
      businessName: 'Example Services', contactName: 'Casey Owner', email: 'owner@example.test',
      phone: '', website: '', address: '', city: '', services: [],
    }, '2026-01-01T00:00:00.000Z')

    expect(stored.answers.business_description).toBe('Family-owned repair service serving the region.')
  })
})
