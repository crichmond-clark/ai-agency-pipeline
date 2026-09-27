'use client'

import { useState, type FormEvent } from 'react'

import type { ClientIntakePrefill } from '@/lib/client-intake'

type ClientIntakeFormProps = { token: string; prefill: ClientIntakePrefill }

export function ClientIntakeForm({ token, prefill }: ClientIntakeFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const initialServices = prefill.services.map(({ name, description }) => description ? `${name} | ${description}` : name).join('\n')

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const values: Record<string, string> = {}
    for (const [name, value] of form.entries()) {
      if (typeof value === 'string') values[name] = value
    }
    const services = (values.services ?? '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const separator = line.indexOf('|')
      return separator < 0
        ? { name: line, description: '' }
        : { name: line.slice(0, separator).trim(), description: line.slice(separator + 1).trim() }
    })
    const claimsPermissionConfirmed = form.get('claimsPermissionConfirmed') === 'on'
    const claims = (values.claims ?? '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const separator = line.indexOf('|')
      return separator < 0
        ? { claim: line, source: '', permissionConfirmed: claimsPermissionConfirmed }
        : { claim: line.slice(0, separator).trim(), source: line.slice(separator + 1).trim(), permissionConfirmed: claimsPermissionConfirmed }
    })
    const externalAssetLinks = (values.externalAssetLinks ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
    const unanswered = (values.unanswered ?? '').split('\n').map((line) => line.trim()).filter(Boolean)

    const answers = {
      businessName: values.businessName ?? '',
      contactName: values.contactName ?? '',
      businessNameConfirmed: form.get('businessNameConfirmed') === 'on',
      contactEmail: values.contactEmail ?? '',
      contactEmailConfirmed: form.get('contactEmailConfirmed') === 'on',
      phone: values.phone ?? '',
      website: values.website ?? '',
      address: values.address ?? '',
      city: values.city ?? '',
      businessDescription: values.businessDescription ?? '',
      services,
      servicesConfirmed: form.get('servicesConfirmed') === 'on',
      serviceAreas: values.serviceAreas ?? '',
      intendedAudience: values.intendedAudience ?? '',
      primaryGoal: values.primaryGoal ?? '',
      brandGuidance: values.brandGuidance ?? '',
      suppliedCopy: values.suppliedCopy ?? '',
      claims,
      externalAssetLinks,
      unanswered,
    }
    const requestBody = new FormData()
    requestBody.set('token', token)
    requestBody.set('answers', JSON.stringify(answers))
    for (const value of form.getAll('assets')) {
      if (typeof value !== 'string' && !(value.size === 0 && value.name === '')) {
        requestBody.append('assets', value, value.name)
      }
    }
    const response = await fetch('/api/client-intakes/submit', {
      method: 'POST',
      cache: 'no-store',
      body: requestBody,
    }).catch(() => null)

    if (!response) {
      setMessage('Unable to submit right now. Please check your connection and try again.')
      setSubmitting(false)
      return
    }
    if (!response.ok) {
      setMessage('This invitation is unavailable or the form needs attention. Please check your answers or contact the person who invited you.')
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return <section className="rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Thank you</h2><p className="mt-2 text-muted-foreground">Your responses have been received and are pending owner review.</p></section>
  }

  return (
    <form onSubmit={submitForm} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Business and contact details</h2>
        <p className="text-sm text-muted-foreground">Lead details are source-provided and may be incomplete. Please correct them as needed. Your confirmed answers remain submitted until an owner reviews them.</p>
        <label className="block space-y-1"><span className="text-sm font-medium">Business name *</span><input name="businessName" required maxLength={150} defaultValue={prefill.businessName} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="businessNameConfirmed" required className="mt-1" /><span>I confirm that this is the business name to use.</span></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Contact person</span><input name="contactName" maxLength={150} defaultValue={prefill.contactName} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Contact email *</span><input type="email" name="contactEmail" required maxLength={254} defaultValue={prefill.email} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="contactEmailConfirmed" required className="mt-1" /><span>I confirm that this email address is reachable and appropriate for website enquiries.</span></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-sm font-medium">Phone</span><input type="tel" name="phone" maxLength={60} defaultValue={prefill.phone} className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">Existing website</span><input type="url" name="website" maxLength={2048} defaultValue={prefill.website} className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">Address</span><input name="address" maxLength={300} defaultValue={prefill.address} className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">Town or city</span><input name="city" maxLength={150} defaultValue={prefill.city} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Business content</h2>
        <label className="block space-y-1"><span className="text-sm font-medium">Describe your business</span><textarea name="businessDescription" rows={4} maxLength={5000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Services *</span><span className="block text-sm text-muted-foreground">Public/AI-structured profile material, when shown, is unverified. Please confirm or correct it. Enter one service per line as “Service name | description”.</span><textarea name="services" required rows={4} maxLength={20000} defaultValue={initialServices} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="servicesConfirmed" required className="mt-1" /><span>I have reviewed and confirm or corrected the services listed above.</span></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Service areas</span><textarea name="serviceAreas" rows={3} maxLength={3000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Who is your intended audience?</span><textarea name="intendedAudience" rows={3} maxLength={3000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">What is the primary goal for the website? *</span><textarea name="primaryGoal" required rows={3} maxLength={3000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Guidance and supplied material</h2>
        <label className="block space-y-1"><span className="text-sm font-medium">Brand guidance</span><textarea name="brandGuidance" rows={4} maxLength={5000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Copy you would like considered</span><textarea name="suppliedCopy" rows={5} maxLength={10000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Claims, accreditations, or testimonials</span><span className="block text-sm text-muted-foreground">One per line as “claim | source”. Items remain pending owner review.</span><textarea name="claims" rows={4} maxLength={20000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="claimsPermissionConfirmed" className="mt-1" /><span>I have permission to share and request use of the claims or testimonials I supplied. Leave unchecked if permission is uncertain.</span></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Links to external assets</span><span className="block text-sm text-muted-foreground">Provide one HTTP(S) link per line. Do not include passwords or private access tokens in a link.</span><textarea name="externalAssetLinks" rows={3} maxLength={20000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Attach private assets</span><span className="block text-sm text-muted-foreground">Up to five JPEG, PNG, WebP, or PDF files; each file may be at most 10 MiB and all files together at most 50 MiB.</span><input type="file" name="assets" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="block w-full text-sm" /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">Information not provided or questions still unanswered</span><span className="block text-sm text-muted-foreground">One item per line; these will remain explicitly missing until answered.</span><textarea name="unanswered" rows={3} maxLength={6000} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      </section>

      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <button type="submit" disabled={submitting} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit for owner review'}</button>
      <p className="text-xs text-muted-foreground">Your answers are private and will not change the existing lead or profile details automatically.</p>
    </form>
  )
}
