import { DemoPageRenderer } from '@/components/demo-renderer/DemoPageRenderer'
import type { HomeServicesTemplateProps } from '@/components/demo-renderer/types'
import { normalizeHomeServicesContent } from '@/lib/demo-content-normalizer'

export function HomeServicesTemplate(props: HomeServicesTemplateProps) {
  const content = normalizeHomeServicesContent(props)

  return <DemoPageRenderer content={content} />
}
