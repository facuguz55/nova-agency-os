import { cn, STATUS_BG } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  const colorClass = STATUS_BG[status as keyof typeof STATUS_BG] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', colorClass, className)}>
      {status}
    </span>
  )
}

interface TagProps {
  children: React.ReactNode
  className?: string
}

export function Tag({ children, className }: TagProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20', className)}>
      {children}
    </span>
  )
}
