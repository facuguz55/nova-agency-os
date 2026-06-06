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
        'bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl transition-all duration-200',
        onClick && 'cursor-pointer hover:border-[rgba(255,255,255,0.12)] hover:bg-[#141414]',
        glow && 'shadow-[0_0_40px_rgba(245,158,11,0.06)]',
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
  color?: 'amber' | 'purple' | 'green' | 'blue' | 'red'
  trend?: { value: string; up: boolean }
  animDelay?: string
}

const ICON_BG: Record<string, string> = {
  amber:  'bg-[rgba(245,158,11,0.1)]  text-[#f59e0b]',
  purple: 'bg-[rgba(139,92,246,0.1)]  text-[#8b5cf6]',
  green:  'bg-[rgba(16,185,129,0.1)]  text-[#10b981]',
  blue:   'bg-[rgba(59,130,246,0.1)]  text-[#3b82f6]',
  red:    'bg-[rgba(239,68,68,0.1)]   text-[#ef4444]',
}

export function StatCard({ label, value, sub, icon, color = 'amber', trend, animDelay }: StatCardProps) {
  return (
    <div
      className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-all duration-200 animate-fade-up"
      style={animDelay ? { animationDelay: animDelay } : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-medium text-[var(--text-3)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', ICON_BG[color])}>
          {icon}
        </div>
      </div>
      <p className="text-[26px] font-bold text-white tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-3)] mt-1.5">{sub}</p>}
      {trend && (
        <div className={cn('inline-flex items-center gap-1 text-[11px] mt-2.5 px-2 py-0.5 rounded-full font-medium', trend.up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  )
}
