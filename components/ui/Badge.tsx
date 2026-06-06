import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  inactive:    'bg-white/5 text-[var(--text-3)] border-white/8',
  prospect:    'bg-blue-500/10 text-blue-400 border-blue-500/15',
  planning:    'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.2)]',
  completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  paused:      'bg-orange-500/10 text-orange-400 border-orange-500/15',
  success:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  failed:      'bg-red-500/10 text-red-400 border-red-500/15',
  running:     'bg-blue-500/10 text-blue-400 border-blue-500/15',
  pending:     'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.15)]',
  executed:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  canceled:    'bg-white/5 text-[var(--text-3)] border-white/8',
  partial:     'bg-amber-400/10 text-amber-300 border-amber-400/15',
  online:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  offline:     'bg-red-500/10 text-red-400 border-red-500/15',
  unreachable: 'bg-orange-500/10 text-orange-400 border-orange-500/15',
  enviado:     'bg-white/5 text-[var(--text-2)] border-white/8',
  'respondió': 'bg-blue-500/10 text-blue-400 border-blue-500/15',
  interesado:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  no_interesa: 'bg-red-500/10 text-red-400 border-red-500/15',
  cerrado:     'bg-purple-500/10 text-purple-400 border-purple-500/15',
  todo:        'bg-white/5 text-[var(--text-2)] border-white/8',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
  review:      'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.15)]',
  done:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  blocked:     'bg-red-500/10 text-red-400 border-red-500/15',
  draft:       'bg-white/5 text-[var(--text-2)] border-white/8',
  sent:        'bg-blue-500/10 text-blue-400 border-blue-500/15',
  accepted:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/15',
  overdue:     'bg-red-500/10 text-red-400 border-red-500/15',
  paid:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
}

const STATUS_LABELS: Record<string, string> = {
  active:      'Activo',
  inactive:    'Inactivo',
  prospect:    'Prospecto',
  planning:    'Planificando',
  completed:   'Completado',
  paused:      'Pausado',
  success:     'Éxito',
  failed:      'Fallido',
  running:     'En curso',
  pending:     'Pendiente',
  executed:    'Ejecutado',
  canceled:    'Cancelado',
  online:      'En línea',
  offline:     'Offline',
  unreachable: 'Inalcanzable',
  enviado:     'Enviado',
  'respondió': 'Respondió',
  interesado:  'Interesado',
  no_interesa: 'No interesa',
  cerrado:     'Cerrado',
  todo:        'Pendiente',
  in_progress: 'En progreso',
  review:      'En revisión',
  done:        'Completado',
  blocked:     'Bloqueado',
  draft:       'Borrador',
  sent:        'Enviado',
  accepted:    'Aceptado',
  rejected:    'Rechazado',
  overdue:     'Vencido',
  paid:        'Pagado',
  partial:     'Parcial',
}

interface BadgeProps { status: string; className?: string }

export function StatusBadge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-white/5 text-[var(--text-2)] border-white/8'
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border',
      style, className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
      'bg-purple-500/10 text-purple-400 border border-purple-500/15',
      className,
    )}>
      {children}
    </span>
  )
}
