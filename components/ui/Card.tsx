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
        'rounded-xl transition-all duration-200',
        onClick && 'cursor-pointer',
        glow && 'shadow-[0_0_40px_rgba(245,158,11,0.06)]',
        className,
      )}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
      }}
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

const ICON_COLORS: Record<string, { bg: string; color: string }> = {
  amber:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  purple: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  green:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  red:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

export function StatCard({ label, value, sub, icon, color = 'amber', trend, animDelay }: StatCardProps) {
  const ic = ICON_COLORS[color]
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 animate-fade-up transition-all duration-200"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        animationDelay: animDelay,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
    >
      {/* Icon badge — top left, standalone like Tatiana */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: ic.bg, color: ic.color }}>
        {icon}
      </div>
      {/* Metric */}
      <div>
        <p className="text-[26px] font-semibold leading-none tracking-tight mb-1"
          style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>{sub}</p>}
      </div>
      {trend && (
        <div className={cn('inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium w-fit', trend.up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  )
}
