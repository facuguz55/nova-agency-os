import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatDateFull(date: string | Date): string {
  const d = new Date(date)
  const absolute = format(d, "d MMM yyyy", { locale: es })
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: es })
  return `${absolute} · ${relative}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

export const STATUS_COLORS = {
  active: 'text-green-400',
  inactive: 'text-gray-400',
  prospect: 'text-blue-400',
  planning: 'text-yellow-400',
  completed: 'text-green-400',
  paused: 'text-orange-400',
  success: 'text-green-400',
  failed: 'text-red-400',
  running: 'text-blue-400',
  pending: 'text-yellow-400',
  executed: 'text-green-400',
  canceled: 'text-gray-400',
  online: 'text-green-400',
  offline: 'text-red-400',
  unreachable: 'text-orange-400',
} as const

export const STATUS_BG = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  prospect: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  planning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  executed: 'bg-green-500/10 text-green-400 border-green-500/20',
  canceled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  online: 'bg-green-500/10 text-green-400 border-green-500/20',
  offline: 'bg-red-500/10 text-red-400 border-red-500/20',
  unreachable: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
} as const
