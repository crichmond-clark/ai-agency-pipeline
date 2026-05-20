import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: true,
  admin: { useAsTitle: 'filename' },
  fields: [{ name: 'alt', type: 'text' }],
}
