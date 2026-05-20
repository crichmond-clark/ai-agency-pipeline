import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Alert({ className, variant = 'default', ...props }: HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'destructive' }) {
  const styles = variant === 'success' ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-100' : variant === 'destructive' ? 'border-red-500/50 bg-red-950/50 text-red-100' : 'border-blue-500/50 bg-blue-950/50 text-blue-100'
  return <div className={cn('rounded-xl border px-4 py-3 text-sm', styles, className)} {...props} />
}
