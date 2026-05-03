import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive:    'bg-[#1a2d45] text-[#4a6080] border-[#1a2d45]',
  prospect:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  planning:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  success:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:      'bg-red-500/10 text-red-400 border-red-500/20',
  running:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  executed:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  canceled:    'bg-[#1a2d45] text-[#4a6080] border-[#1a2d45]',
  online:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  offline:     'bg-red-500/10 text-red-400 border-red-500/20',
  unreachable: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  enviado:     'bg-[#1a2d45] text-[#64748b] border-[#1a2d45]',
  'respondió': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  interesado:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  no_interesa: 'bg-red-500/10 text-red-400 border-red-500/20',
  cerrado:     'bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/20',
}

interface BadgeProps { status: string; className?: string }

export function StatusBadge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-[#1a2d45] text-[#4a6080] border-[#1a2d45]'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border',
      style, className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
      'bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20',
      className,
    )}>
      {children}
    </span>
  )
}
