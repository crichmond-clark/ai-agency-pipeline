import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import '@payloadcms/ui/scss/app.scss'
import type { ReactNode } from 'react'
import type { ServerFunctionClient } from 'payload'

import { importMap } from './admin/importMap.js'

type Args = {
  children: ReactNode
}

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function PayloadLayout({ children }: Args) {
  return RootLayout({
    config,
    importMap,
    serverFunction,
    children,
  })
}
