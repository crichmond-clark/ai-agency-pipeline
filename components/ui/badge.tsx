import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type BadgeVariant = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple' | 'cyan'

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-zinc-700 text-zinc-100 ring-zinc-500',
  blue: 'bg-blue-600 text-white ring-blue-400/70',
  green: 'bg-emerald-600 text-white ring-emerald-400/70',
  amber: 'bg-amber-500 text-zinc-950 ring-amber-300/80',
  red: 'bg-red-600 text-white ring-red-400/70',
  slate: 'bg-zinc-200 text-zinc-950 ring-zinc-400',
  purple: 'bg-violet-600 text-white ring-violet-400/70',
  cyan: 'bg-cyan-600 text-white ring-cyan-400/70',
}

export function Badge({ className, variant = 'neutral', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset shadow-sm', variants[variant], className)} {...props} />
}
