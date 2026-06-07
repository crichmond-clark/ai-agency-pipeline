import { ArrowRight, CheckCircle2, MapPin, Phone } from 'lucide-react'

import type { DemoContentPayload } from '@/types/ai'

type Props = {
  businessName: string
  city?: string
  phone?: string
  email?: string
  content: DemoContentPayload
}

type DisplayService = {
  title: string
  description: string
}

const internalCopyPatterns = [
  /\bconcepts?\b/i,
  /\bmockups?\b/i,
  /\bdemos?\b/i,
  /\btemplates?\b/i,
  /\bgenerated\b/i,
  /\blayouts?\b/i,
  /\bwebsites?\b/i,
  /\bhomepages?\b/i,
  /\bpages?\b/i,
  /\bonline home\b/i,
  /\blead data\b/i,
  /\bbusiness profile\b/i,
  /\bservice information\b/i,
  /\bcontact prompts?\b/i,
  /\bservice-area messaging\b/i,
]

const processSteps = [
  { title: 'Call or send an enquiry', body: 'Start with the job, property, or problem that needs attention.' },
  { title: 'Talk through the details', body: 'Share the service needed, location, timing, and any useful context.' },
  { title: 'Agree the next step', body: 'Use the contact details to arrange a quote, visit, or follow-up conversation.' },
]

const fallbackTrustReasons = [
  'Straightforward contact details for local enquiries',
  'Clear service areas and practical next steps',
  'A simple way to discuss the job before booking',
]

export function HomeServicesTemplate({ businessName, city, phone, email, content }: Props) {
  const contactHref = phone ? `tel:${phone}` : '#contact'
  const fallbackArea = city ? `Serving ${city} and nearby areas.` : 'Serving the local area.'
  const serviceArea = safeText(content.service_area, fallbackArea)
  const serviceAreaLabel = city ? `Serving ${city} and nearby areas` : serviceArea
  const secondaryContactHref = email ? `mailto:${email}` : '#contact'
  const heroEyebrow = safeText(content.hero.eyebrow, 'Local home services')
  const heroHeadline = safeText(content.hero.headline, city ? `Reliable local help in ${city}` : `Reliable local help from ${businessName}`)
  const heroSubheadline = safeText(content.hero.subheadline, `Contact ${businessName} to talk through the service needed, property details, and next steps.`)
  const primaryCta = safeText(content.hero.cta, 'Request a quote')
  const secondaryCta = safeText(content.contact_cta.button_label, 'Send enquiry')
  const contactBody = safeText(content.contact_cta.body, 'Call or send an enquiry with the service needed, location, and any useful details.')
  const contactHeadline = safeText(content.contact_cta.headline, 'Need help with a local job?')
  const services = content.services.map((service) => toDisplayService(service, city))
  const trustReasons = toDisplayReasons(content.why_choose_us)

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-[#17211b]">
      <header className="border-b border-[#d4c4aa] bg-[#f7f1e8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <a className="text-2xl font-black tracking-[-0.04em] text-[#14231c]" href="#top" aria-label={`${businessName} home`}>
            {businessName}
          </a>
          <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-bold uppercase tracking-[0.18em] text-[#4d594f]" aria-label="Page sections">
            <a className="transition hover:text-[#14231c]" href="#services">Services</a>
            <a className="transition hover:text-[#14231c]" href="#why">Why call</a>
            <a className="transition hover:text-[#14231c]" href="#contact">Contact</a>
          </nav>
          {phone ? (
            <a className="inline-flex items-center justify-center gap-2 bg-[#f0b429] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#14231c] transition hover:bg-[#ffd46a]" href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          ) : null}
        </div>
      </header>

      <section className="border-b border-[#d4c4aa]" id="top">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.15fr_0.85fr]">
          <div className="px-5 py-16 md:py-24 lg:px-8 lg:py-28">
            <p className="text-sm font-black uppercase tracking-[0.32em] text-[#9b5a1a]">{heroEyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-[#14231c] sm:text-6xl lg:text-7xl">
              {heroHeadline}
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-9 text-[#4d594f]">{heroSubheadline}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex items-center justify-center gap-3 bg-[#14231c] px-7 py-4 font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#284235]" href={contactHref}>
                {phone ? `Call ${phone}` : primaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a className="inline-flex items-center justify-center border-2 border-[#14231c] px-7 py-4 font-black uppercase tracking-[0.16em] text-[#14231c] transition hover:bg-[#14231c] hover:text-white" href={secondaryContactHref}>
                {secondaryCta}
              </a>
            </div>
          </div>

          <aside className="border-t border-[#d4c4aa] bg-[#15372f] px-5 py-12 text-white lg:border-l lg:border-t-0 lg:px-10 lg:py-28" aria-label="Contact summary">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#f0b429]">Local service</p>
            <div className="mt-8 space-y-8">
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#f0b429]" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">Area</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{serviceAreaLabel}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-[#f0b429]" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">Contact</p>
                    {phone ? <a className="mt-2 block text-3xl font-black tracking-[-0.05em] text-white transition hover:text-[#f0b429]" href={`tel:${phone}`}>{phone}</a> : <p className="mt-2 text-2xl font-black tracking-[-0.04em]">Use the enquiry details below</p>}
                    {email ? <a className="mt-3 block text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white" href={`mailto:${email}`}>{email}</a> : null}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/20 pt-6">
                <p className="max-w-md text-lg leading-8 text-white/80">{contactBody}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#d4c4aa] bg-[#fffaf0]" id="services">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#9b5a1a]">Services</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#14231c] md:text-5xl">What customers can call about</h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-[#4d594f]">
              For repairs, planned work, or practical enquiries, the services below outline common ways to get help from {businessName}.
            </p>
          </div>

          <div className="mt-12 border-t border-[#d4c4aa]">
            {services.map((service, index) => (
              <article className="grid gap-5 border-b border-[#d4c4aa] py-8 md:grid-cols-[6rem_0.7fr_1fr] md:items-start" key={`${service.title}-${index}`}>
                <span className="font-mono text-sm font-bold text-[#9b5a1a]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-2xl font-black tracking-[-0.04em] text-[#14231c]">{service.title}</h3>
                <p className="text-lg leading-8 text-[#4d594f]">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#d4c4aa] bg-[#14231c] text-white" id="why">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[0.44fr_1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#f0b429]">Why call</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">Practical details before a customer gets in touch</h2>
          </div>
          <div className="border-t border-white/20">
            {trustReasons.map((reason) => (
              <div className="flex gap-5 border-b border-white/20 py-6" key={reason}>
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#f0b429]" />
                <p className="text-xl leading-8 text-white/80">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#d4c4aa] bg-[#f7f1e8]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#9b5a1a]">Next steps</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#14231c] md:text-5xl">Simple ways to get help</h2>
            </div>
            <div className="grid border-t border-[#d4c4aa] md:grid-cols-3 md:border-l md:border-t-0">
              {processSteps.map((step, index) => (
                <div className="border-b border-[#d4c4aa] py-7 md:border-b-0 md:border-r md:px-7" key={step.title}>
                  <span className="font-mono text-sm font-bold text-[#9b5a1a]">0{index + 1}</span>
                  <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#14231c]">{step.title}</h3>
                  <p className="mt-4 leading-7 text-[#4d594f]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f0b429]" id="contact">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="font-black uppercase tracking-[0.24em] text-[#59390d]">{serviceArea}</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] text-[#14231c] md:text-5xl">{contactHeadline}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {phone ? <a className="bg-[#14231c] px-7 py-4 text-center font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#284235]" href={`tel:${phone}`}>Call {phone}</a> : null}
            {email ? <a className="border-2 border-[#14231c] px-7 py-4 text-center font-black uppercase tracking-[0.16em] text-[#14231c] transition hover:bg-[#14231c] hover:text-white" href={`mailto:${email}`}>{secondaryCta}</a> : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d4c4aa] bg-[#fffaf0] px-5 py-8 text-sm leading-6 text-[#5b655d] lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <p className="font-black tracking-[-0.03em] text-[#14231c]">{businessName}</p>
          <p className="max-w-3xl md:text-right">{content.footer_disclaimer}</p>
        </div>
      </footer>
    </main>
  )
}

function toDisplayService(service: DemoContentPayload['services'][number], city: string | undefined): DisplayService {
  const serviceTitle = safeText(service.title, 'Local services')
  const fallbackDescription = city
    ? `Talk through ${serviceTitle.toLowerCase()} needs and next steps for properties in ${city}.`
    : `Talk through ${serviceTitle.toLowerCase()} needs, property details, and next steps.`
  return {
    title: serviceTitle,
    description: safeText(service.description, fallbackDescription),
  }
}

function toDisplayReasons(reasons: string[]): string[] {
  const safeReasons = reasons.map((reason) => safeText(reason, '')).filter(Boolean)
  return safeReasons.length ? safeReasons : fallbackTrustReasons
}

function safeText(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (!trimmed || internalCopyPatterns.some((pattern) => pattern.test(trimmed))) return fallback
  return trimmed
}
