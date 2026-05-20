'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

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
    <section style={{ border: '1px solid #ddd', borderRadius: 8, marginBottom: 24, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Import leads from CSV</h2>
      <p style={{ color: '#555', marginTop: 0 }}>
        Upload a business-finder CSV. Existing leads are updated by Google place ID, or by business name + city when no place ID exists.
      </p>
      <form onSubmit={handleSubmit} style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <input accept=".csv,text/csv" disabled={isImporting} ref={fileInputRef} type="file" />
        <button disabled={isImporting} type="submit">{isImporting ? 'Importing…' : 'Import leads'}</button>
      </form>
      {message ? <p style={{ color: 'green', marginBottom: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: 'crimson', marginBottom: 0 }}>{error}</p> : null}
    </section>
  )
}
