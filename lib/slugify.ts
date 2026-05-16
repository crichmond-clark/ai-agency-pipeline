export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function demoSlugForLead(lead: { business_name?: string | null; city?: string | null; id?: string | number | null }): string {
  const base = slugify([lead.business_name, lead.city].filter(Boolean).join(' ')) || 'demo'
  return `${base}-${String(lead.id ?? Date.now()).slice(-6)}`
}
