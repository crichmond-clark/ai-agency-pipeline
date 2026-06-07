import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'AI Demo Website Pipeline',
  description: 'Human-in-the-loop local business demo site pipeline',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
