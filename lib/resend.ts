import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  body: string
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
  })

  if (result.error) throw new Error(result.error.message)
  return { providerMessageId: result.data?.id }
}
