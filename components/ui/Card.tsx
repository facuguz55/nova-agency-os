import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5 transition-colors duration-150',
        onClick && 'cursor-pointer hover:border-[#253f60]',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color?: 'orange' | 'purple' | 'green' | 'blue'
  trend?: { value: string; up: boolean }
}

const ICON_COLOR = {
  orange: 'bg-[#f97316]/10 text-[#f97316]',
  purple: 'bg-[#a855f7]/10 text-[#a855f7]',
  green:  'bg-emerald-500/10 text-emerald-400',
  blue:   'bg-blue-500/10 text-blue-400',
}

export function StatCard({ label, value, sub, icon, color = 'orange', trend }: StatCardProps) {
  return (
    <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5 hover:border-[#253f60] transition-colors duration-150">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-[#4a6080]">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ICON_COLOR[color])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[#4a6080] mt-1">{sub}</p>}
      {trend && (
        <p className={cn('text-xs mt-2 font-medium', trend.up ? 'text-emerald-400' : 'text-red-400')}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
