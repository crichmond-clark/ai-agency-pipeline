import config from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { getPayload, type PayloadRequest } from 'payload'

import { HomeServicesTemplate } from '@/components/demo-templates/HomeServicesTemplate'
import { DemoContentSchema } from '@/types/ai'

export const dynamic = 'force-dynamic'

export default async function AdminDemoPreviewPage({ params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) notFound()

  const { leadId } = await params
  const lead = await payload.findByID({ collection: 'leads', id: leadId })
  const demos = await payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' })
  const demoSite = demos.docs[0]
  if (!demoSite) notFound()

  const content = DemoContentSchema.parse(demoSite.content)

  return <>
    <aside className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 shadow-sm">
      <div className="flex items-center gap-2"><Eye className="h-4 w-4" /><strong>Admin preview</strong><span className="text-blue-800">This view bypasses public availability and portfolio restrictions.</span></div>
      <Link className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-1.5 font-medium transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href={`/dashboard/review/${lead.id}`}><ArrowLeft className="h-4 w-4" /> Back to review</Link>
    </aside>
    <HomeServicesTemplate businessName={lead.business_name} city={lead.city ?? undefined} phone={lead.phone ?? undefined} email={lead.email ?? undefined} content={content} />
  </>
}
