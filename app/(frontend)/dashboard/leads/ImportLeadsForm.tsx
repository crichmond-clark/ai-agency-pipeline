'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ImportResult = {
  created: number
  updated: number
}

export function ImportLeadsForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Choose a CSV file first')
      return
    }

    setIsImporting(true)

    try {
      const response = await fetch('/api/import-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: await file.text(),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Import failed')
        return
      }

      const importResult = result as ImportResult
      setMessage(`Created ${importResult.created}, updated ${importResult.updated}`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.refresh()
    } catch {
      setError('Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-4 w-4 text-primary" /> Import Leads</CardTitle><CardDescription id="csv-import-help">Upload a business-finder CSV. Existing Leads match by Google place ID, or business name and city when no place ID exists.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <form aria-busy={isImporting} className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
          <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium" htmlFor="lead-csv">CSV file<input accept=".csv,text/csv" aria-describedby="csv-import-help" className="block h-10 w-full cursor-pointer rounded-md border border-input bg-background text-sm text-muted-foreground transition-colors file:mr-3 file:h-full file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:text-sm file:font-medium file:text-foreground hover:border-primary/50 hover:file:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={isImporting} id="lead-csv" ref={fileInputRef} type="file" /></label>
          <Button className="sm:shrink-0" disabled={isImporting} type="submit">{isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{isImporting ? 'Importing…' : 'Import Leads'}</Button>
        </form>
        {message ? <Alert aria-live="polite" className="border-emerald-200 bg-emerald-50 text-emerald-950" role="status"><AlertTitle>Import complete</AlertTitle><AlertDescription>{message}</AlertDescription></Alert> : null}
        {error ? <Alert className="border-red-200 bg-red-50 text-red-950"><AlertTitle>Import failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  )
}
