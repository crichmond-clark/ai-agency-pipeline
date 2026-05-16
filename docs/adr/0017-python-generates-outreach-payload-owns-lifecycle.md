# Python generates outreach copy, Payload owns the draft lifecycle

The Python AI Service generates outreach subject/body copy and safety notes, while Payload owns the Outreach Draft record, validation before saving, admin review/acceptance, send-button rules, and Resend delivery. This keeps all OpenAI calls behind the AI Service boundary without giving the AI layer control over sales state or email sending.
