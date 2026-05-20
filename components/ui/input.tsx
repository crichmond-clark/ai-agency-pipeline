import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input className={cn('flex h-10 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm transition file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500', className)} ref={ref} {...props} />
})
