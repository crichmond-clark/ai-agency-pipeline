import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { HomeServicesTemplate } from '@/components/demo-templates/HomeServicesTemplate'
import { isDemoSiteAvailable } from '@/lib/demo-availability'
import { DemoContentSchema } from '@/types/ai'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

type PageProps = { params: Promise<{ slug: string }> }

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'demo-sites',
    where: {
      and: [
        { slug: { equals: slug } },
        { is_public: { equals: true } },
        { removed_at: { exists: false } },
      ],
    },
    limit: 1,
    depth: 1,
  })

  const demoSite = result.docs[0]
  if (!demoSite || !isDemoSiteAvailable(demoSite)) notFound()

  const lead = typeof demoSite.lead === 'object' ? demoSite.lead : null
  if (!lead) notFound()

  const content = DemoContentSchema.parse(demoSite.content)
  const portfolioMode = process.env.PORTFOLIO_MODE === 'true'
  if (portfolioMode && !lead.is_sample_lead) notFound()

  return (
    <HomeServicesTemplate
      businessName={lead.business_name}
      city={lead.city ?? undefined}
      phone={portfolioMode ? undefined : lead.phone ?? undefined}
      email={portfolioMode ? undefined : lead.email ?? undefined}
      content={content}
    />
  )
}
