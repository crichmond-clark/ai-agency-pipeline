import type { DemoTemplateManifest, HomeServicesVariant } from '@/components/demo-renderer/types'

export const homeServicesManifests: Record<HomeServicesVariant, DemoTemplateManifest> = {
  contractor_classic: {
    key: 'contractor_classic',
    label: 'Contractor classic',
    sections: ['header', 'hero', 'services', 'trust', 'process', 'cta', 'footer'],
  },
  emergency_first: {
    key: 'emergency_first',
    label: 'Emergency first',
    sections: ['header', 'hero', 'cta', 'services', 'trust', 'process', 'footer'],
  },
  premium_local: {
    key: 'premium_local',
    label: 'Premium local',
    sections: ['header', 'hero', 'services', 'process', 'trust', 'cta', 'footer'],
  },
  clean_modern: {
    key: 'clean_modern',
    label: 'Clean modern',
    sections: ['header', 'hero', 'services', 'process', 'cta', 'footer'],
  },
}

export function getHomeServicesManifest(variant: HomeServicesVariant): DemoTemplateManifest {
  return homeServicesManifests[variant] ?? homeServicesManifests.contractor_classic
}
