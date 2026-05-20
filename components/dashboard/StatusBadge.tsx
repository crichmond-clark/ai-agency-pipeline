import { Badge } from '@/components/ui/badge'
import { statusLabel, statusVariant } from '@/components/dashboard/status'

export { statusLabel, statusVariant }

export function StatusBadge({ value }: { value: string | boolean | null | undefined }) {
  return <Badge variant={statusVariant(value)}>{statusLabel(value)}</Badge>
}
