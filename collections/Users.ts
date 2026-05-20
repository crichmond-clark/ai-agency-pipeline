import type { CollectionConfig } from 'payload'

import { authenticated } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: { useAsTitle: 'email' },
  fields: [],
}
