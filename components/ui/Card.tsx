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
        'bg-[#1e293b] border border-[#334155] rounded-xl p-4',
        onClick && 'cursor-pointer hover:border-[#ff8c42]/40 transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, color = 'orange' }: {
  label: string
  value: string | number
  sub?: string
  icon?: string
  color?: 'orange' | 'purple' | 'green' | 'blue'
}) {
  const colorMap = {
    orange: 'text-[#ff8c42] bg-[#ff8c42]/10 border-[#ff8c42]/20',
    purple: 'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#475569] uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-[#475569] mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border text-lg', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
