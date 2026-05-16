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
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">{content.hero.eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{content.hero.headline}</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">{content.hero.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950" href={phone ? `tel:${phone}` : '#contact'}>{content.hero.cta}</a>
            {city && <span className="rounded-full border border-white/20 px-6 py-3 text-slate-200">Serving {city}</span>}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Services</p>
          <h2 className="mt-3 text-3xl font-bold">How {businessName} can help</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {content.services.map((service) => (
              <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200" key={service.title}>
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-stone-600">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why choose us</p>
            <h2 className="mt-3 text-3xl font-bold">A simpler way to earn trust online</h2>
          </div>
          <ul className="grid gap-4">
            {content.why_choose_us.map((reason) => (
              <li className="rounded-xl bg-stone-50 p-5 text-stone-700" key={reason}>✓ {reason}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 p-8 text-white md:p-12" id="contact">
          <p className="text-amber-300">{content.service_area}</p>
          <h2 className="mt-3 text-3xl font-bold">{content.contact_cta.headline}</h2>
          <p className="mt-4 max-w-2xl text-slate-200">{content.contact_cta.body}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            {phone && <a className="rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950" href={`tel:${phone}`}>{phone}</a>}
            {email && <a className="rounded-full border border-white/30 px-6 py-3 font-semibold" href={`mailto:${email}`}>{content.contact_cta.button_label}</a>}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-6 py-8 text-center text-sm text-stone-500">
        {content.footer_disclaimer}
      </footer>
    </main>
  )
}
