import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { BusinessProfiles } from './collections/BusinessProfiles'
import { ContactAttempts } from './collections/ContactAttempts'
import { DemoSites } from './collections/DemoSites'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { OutreachMessages } from './collections/OutreachMessages'
import { Users } from './collections/Users'
import { WorkflowRuns } from './collections/WorkflowRuns'
import { AiSettings } from './globals/AiSettings'
import { requiredEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, Leads, BusinessProfiles, DemoSites, OutreachMessages, ContactAttempts, WorkflowRuns, Media],
  globals: [AiSettings],
  db: postgresAdapter({ pool: { connectionString: requiredEnv('DATABASE_URI') } }),
  editor: lexicalEditor(),
  secret: requiredEnv('PAYLOAD_SECRET'),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
