'use client'

import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Import leads from CSV</CardTitle>
        <CardDescription>Upload a business-finder CSV. Existing leads update by Google place ID, or business name + city when no place ID exists.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <Input accept=".csv,text/csv" disabled={isImporting} ref={fileInputRef} type="file" />
          <Button disabled={isImporting} type="submit">{isImporting ? 'Importing…' : 'Import leads'}</Button>
        </form>
        {message ? <Alert variant="success">{message}</Alert> : null}
        {error ? <Alert variant="destructive">{error}</Alert> : null}
      </CardContent>
    </Card>
  )
}
