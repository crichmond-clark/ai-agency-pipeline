import { CheckCircle2, MapPin, Phone } from 'lucide-react'

import type { DemoContentPayload } from '@/types/ai'

type Props = {
  businessName: string
  city?: string
  phone?: string
  email?: string
  content: DemoContentPayload
}

export function HomeServicesTemplate({ businessName, city, phone, email, content }: Props) {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <header className="absolute left-0 right-0 top-0 z-10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/15 bg-white/10 px-5 py-3 text-white backdrop-blur">
          <span className="font-bold tracking-tight">{businessName}</span>
          {phone ? <a className="hidden items-center gap-2 text-sm font-semibold text-amber-200 sm:flex" href={`tel:${phone}`}><Phone className="h-4 w-4" /> {phone}</a> : null}
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 px-6 pb-24 pt-36 text-white sm:pt-44">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_30rem),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_32rem)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">{content.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">{content.hero.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{content.hero.subheadline}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a className="rounded-full bg-amber-300 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200" href={phone ? `tel:${phone}` : '#contact'}>{content.hero.cta}</a>
              {city ? <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-slate-200"><MapPin className="h-4 w-4" /> Serving {city}</span> : null}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Concept mockup</p>
            <h2 className="mt-4 text-2xl font-bold">A clearer homepage for local customers</h2>
            <p className="mt-4 leading-7 text-slate-200">This layout turns services, service area, and contact details into a fast, trustworthy first impression.</p>
            <div className="mt-6 grid gap-3">
              {content.why_choose_us.slice(0, 3).map((reason) => <p className="flex gap-3 rounded-2xl bg-white/10 p-4 text-sm text-slate-100" key={reason}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> {reason}</p>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Services</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl text-4xl font-bold tracking-tight">How {businessName} can help</h2>
            <p className="max-w-md text-slate-600">Simple, clear service cards help visitors quickly understand whether this business can solve their problem.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {content.services.map((service) => (
              <article className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" key={service.title}>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><CheckCircle2 className="h-6 w-6" /></div>
                <h3 className="text-xl font-bold">{service.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Why choose us</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Built to make trust obvious</h2>
            <p className="mt-5 leading-7 text-slate-600">The page prioritises practical details customers look for before they call.</p>
          </div>
          <ul className="grid gap-4">
            {content.why_choose_us.map((reason) => (
              <li className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700" key={reason}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl" id="contact">
          <div className="grid gap-8 p-8 text-white md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-semibold text-amber-300">{content.service_area}</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">{content.contact_cta.headline}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-200">{content.contact_cta.body}</p>
            </div>
            <div className="flex flex-wrap gap-4 lg:flex-col">
              {phone ? <a className="rounded-full bg-amber-300 px-6 py-3 text-center font-bold text-slate-950 hover:bg-amber-200" href={`tel:${phone}`}>{phone}</a> : null}
              {email ? <a className="rounded-full border border-white/30 px-6 py-3 text-center font-bold text-white hover:bg-white/10" href={`mailto:${email}`}>{content.contact_cta.button_label}</a> : null}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white px-6 py-8 text-center text-sm leading-6 text-stone-500">
        <p className="mx-auto max-w-4xl">{content.footer_disclaimer}</p>
      </footer>
    </main>
  )
}
