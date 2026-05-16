import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ margin: '4rem auto', maxWidth: 720, fontFamily: 'system-ui' }}>
      <h1>AI Demo Website Pipeline</h1>
      <p>Use the Payload admin to import leads and manage the demo workflow.</p>
      <p><Link href="/admin">Open admin</Link></p>
      <p><Link href="/dashboard/leads">Open lead dashboard</Link></p>
    </main>
  )
}
