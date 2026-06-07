import type { ReactNode } from 'react'

import { DemoCta } from '@/components/demo-sections/DemoCta'
import { DemoFooter } from '@/components/demo-sections/DemoFooter'
import { DemoHeader } from '@/components/demo-sections/DemoHeader'
import { DemoHero } from '@/components/demo-sections/DemoHero'
import { DemoProcess } from '@/components/demo-sections/DemoProcess'
import { DemoServices } from '@/components/demo-sections/DemoServices'
import { DemoTrust } from '@/components/demo-sections/DemoTrust'
import { getHomeServicesManifest } from '@/components/demo-templates/home-services-manifests'
import type { DemoSectionKey, DemoSectionProps, NormalizedHomeServicesContent } from '@/components/demo-renderer/types'
import { resolveDemoTheme, toDemoThemeStyle } from '@/lib/demo-theme'

const sectionComponents: Record<DemoSectionKey, (props: DemoSectionProps) => ReactNode> = {
  header: DemoHeader,
  hero: DemoHero,
  services: DemoServices,
  trust: DemoTrust,
  process: DemoProcess,
  cta: DemoCta,
  footer: DemoFooter,
}

type Props = {
  content: NormalizedHomeServicesContent
}

export function DemoPageRenderer({ content }: Props) {
  const theme = resolveDemoTheme(content.themeInput)
  const manifest = getHomeServicesManifest(content.variant)
  const sectionProps = { content, theme }

  return (
    <main className="min-h-screen bg-[var(--demo-bg)] text-[var(--demo-text)]" data-demo-variant={manifest.key} style={toDemoThemeStyle(theme)}>
      {manifest.sections.map((sectionKey) => {
        const Section = sectionComponents[sectionKey]
        return <Section {...sectionProps} key={sectionKey} />
      })}
    </main>
  )
}
