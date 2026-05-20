import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-500',
  secondary: 'bg-zinc-700 text-zinc-50 shadow-sm hover:bg-zinc-600 focus-visible:outline-zinc-400',
  outline: 'border border-zinc-600 bg-zinc-900 text-zinc-100 shadow-sm hover:bg-zinc-800 focus-visible:outline-blue-500',
  ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-blue-500',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:outline-red-500',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offset-zinc-950',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
}

export function ButtonLink({ className, variant = 'primary', size = 'md', href, ...props }: ButtonLinkProps) {
  return <Link className={cn('inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offset-zinc-950', variants[variant], sizes[size], className)} href={href} {...props} />
}
