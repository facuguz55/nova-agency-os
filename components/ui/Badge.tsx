import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active:     'bg-green-500/10  text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  inactive:   'bg-[#1e2f4a]    text-[#475569]  border-[#1e2f4a]',
  prospect:   'bg-blue-500/10  text-blue-400   border-blue-500/25   shadow-[0_0_8px_rgba(59,130,246,.15)]',
  planning:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/25 shadow-[0_0_8px_rgba(234,179,8,.15)]',
  completed:  'bg-green-500/10  text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  paused:     'bg-orange-500/10 text-orange-400 border-orange-500/25 shadow-[0_0_8px_rgba(249,115,22,.15)]',
  success:    'bg-green-500/10  text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  failed:     'bg-red-500/10   text-red-400    border-red-500/25    shadow-[0_0_8px_rgba(239,68,68,.15)]',
  running:    'bg-blue-500/10  text-blue-400   border-blue-500/25   shadow-[0_0_8px_rgba(59,130,246,.15)]',
  pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/25 shadow-[0_0_8px_rgba(234,179,8,.15)]',
  executed:   'bg-green-500/10  text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  canceled:   'bg-[#1e2f4a]    text-[#475569]  border-[#1e2f4a]',
  online:     'bg-green-500/10  text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  offline:    'bg-red-500/10   text-red-400    border-red-500/25    shadow-[0_0_8px_rgba(239,68,68,.15)]',
  unreachable: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  enviado:     'bg-[#1e2f4a]    text-[#64748b]  border-[#1e2f4a]',
  'respondió': 'bg-blue-500/10  text-blue-400   border-blue-500/25   shadow-[0_0_8px_rgba(59,130,246,.15)]',
  interesado:  'bg-green-500/10 text-green-400  border-green-500/25  shadow-[0_0_8px_rgba(34,197,94,.15)]',
  no_interesa: 'bg-red-500/10   text-red-400    border-red-500/25    shadow-[0_0_8px_rgba(239,68,68,.15)]',
  cerrado:     'bg-[#a855f7]/10 text-[#c084fc]  border-[#a855f7]/25  shadow-[0_0_8px_rgba(168,85,247,.15)]',
}

interface BadgeProps { status: string; className?: string }

export function StatusBadge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-[#1e2f4a] text-[#475569] border-[#1e2f4a]'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wider',
      style, className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium',
      'bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20',
      className,
    )}>
      {children}
    </span>
  )
}
