import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  body: string
  idempotencyKey?: string
}

export async function sendOutreachEmail(input: SendEmailInput): Promise<{ providerMessageId?: string }> {
  if (process.env.PORTFOLIO_MODE === 'true') {
    throw new Error('Sending is disabled in portfolio mode')
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) throw new Error('Resend is not configured')

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.body,
  }, input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined)

  if (result.error) throw new Error(result.error.message)
  return { providerMessageId: result.data?.id }
}

export async function sendClientIntakeInvitation(input: {
  to: string
  businessName: string
  url: string
  idempotencyKey: string
}): Promise<{ providerMessageId?: string }> {
  if (process.env.PORTFOLIO_MODE === 'true') {
    throw new Error('Sending is disabled in portfolio mode')
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) throw new Error('Resend is not configured')

  const resend = new Resend(apiKey)
  const businessName = input.businessName.replace(/[\r\n]+/g, ' ').trim().slice(0, 150)
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: `Complete your ${businessName} website content questionnaire`,
    text: [
      `Hello,`,
      ``,
      `You are invited to provide website content for ${businessName}. This private link expires in seven days and can be submitted once:`,
      input.url,
      ``,
      `If you were not expecting this invitation, you can ignore this email.`,
    ].join('\n'),
  }, { idempotencyKey: input.idempotencyKey })

  if (result.error) throw new Error(result.error.message)
  return { providerMessageId: result.data?.id }
}
