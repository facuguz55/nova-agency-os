import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[#64748b]">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg text-[#e2e8f0] placeholder-[#253f60]',
          'bg-[#080f1e] border border-[#1a2d45]',
          'focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/20',
          'transition-colors duration-150',
          error && 'border-red-500/50',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string
}
export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[#64748b]">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg text-[#e2e8f0]',
          'bg-[#080f1e] border border-[#1a2d45]',
          'focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/20',
          'transition-colors duration-150',
          error && 'border-red-500/50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string
}
export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[#64748b]">{label}</label>}
      <textarea
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg text-[#e2e8f0] placeholder-[#253f60] resize-none',
          'bg-[#080f1e] border border-[#1a2d45]',
          'focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/20',
          'transition-colors duration-150',
          error && 'border-red-500/50',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

export function Button({
  children, variant = 'primary', size = 'md', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const variants: Record<Variant, string> = {
    primary:   'btn-primary text-white font-semibold',
    secondary: 'bg-[#0f1d30] hover:bg-[#152338] text-[#94a3b8] hover:text-white border border-[#1a2d45] hover:border-[#253f60] transition-colors',
    danger:    'bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-colors',
    ghost:     'hover:bg-white/[.04] text-[#64748b] hover:text-[#94a3b8] transition-colors',
  }
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-sm rounded-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
