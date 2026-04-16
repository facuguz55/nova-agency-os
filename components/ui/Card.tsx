import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  glow?: boolean
}

export function Card({ children, className, onClick, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#111e33] border border-[#1e2f4a] rounded-2xl p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-[#ff8c42]/30 hover:shadow-[0_0_24px_rgba(255,140,66,.08)]',
        glow && 'shadow-[0_0_30px_rgba(255,140,66,.06)]',
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

const ACCENT = {
  orange: {
    ring:  'border-[#ff8c42]/20',
    glow:  'stat-accent-orange',
    icon:  'bg-[#ff8c42]/10 border border-[#ff8c42]/20 text-[#ff8c42]',
    iconGlow: 'drop-shadow-[0_0_8px_rgba(255,140,66,.7)]',
    val:   'text-white',
  },
  purple: {
    ring:  'border-[#a855f7]/20',
    glow:  'stat-accent-purple',
    icon:  'bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7]',
    iconGlow: 'drop-shadow-[0_0_8px_rgba(168,85,247,.7)]',
    val:   'text-white',
  },
  green: {
    ring:  'border-green-500/20',
    glow:  'stat-accent-green',
    icon:  'bg-green-500/10 border border-green-500/20 text-green-400',
    iconGlow: 'drop-shadow-[0_0_8px_rgba(34,197,94,.7)]',
    val:   'text-white',
  },
  blue: {
    ring:  'border-blue-500/20',
    glow:  'stat-accent-blue',
    icon:  'bg-blue-500/10 border border-blue-500/20 text-blue-400',
    iconGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,.7)]',
    val:   'text-white',
  },
}

export function StatCard({ label, value, sub, icon, color = 'orange', trend }: StatCardProps) {
  const a = ACCENT[color]
  return (
    <div className={cn('bg-[#0e1a2e] border rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]', a.ring, a.glow)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-[#475569] uppercase tracking-widest">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', a.icon)}>
          <span className={cn('text-base', a.iconGlow)}>{icon}</span>
        </div>
      </div>
      <p className={cn('text-3xl font-bold tracking-tight', a.val)}>{value}</p>
      {sub && <p className="text-xs text-[#475569] mt-1.5">{sub}</p>}
      {trend && (
        <p className={cn('text-xs mt-2 font-medium', trend.up ? 'text-green-400' : 'text-red-400')}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
