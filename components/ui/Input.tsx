import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-[#334155]',
          'bg-[#080f1e] border border-[#1e2f4a]',
          'focus:outline-none focus:border-[#ff8c42]/50 focus:shadow-[0_0_0_3px_rgba(255,140,66,.08)]',
          'transition-all duration-150',
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
      {label && <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-2.5 text-sm rounded-xl text-white',
          'bg-[#080f1e] border border-[#1e2f4a]',
          'focus:outline-none focus:border-[#ff8c42]/50 focus:shadow-[0_0_0_3px_rgba(255,140,66,.08)]',
          'transition-all duration-150',
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
      {label && <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider">{label}</label>}
      <textarea
        className={cn(
          'w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-[#334155] resize-none',
          'bg-[#080f1e] border border-[#1e2f4a]',
          'focus:outline-none focus:border-[#ff8c42]/50 focus:shadow-[0_0_0_3px_rgba(255,140,66,.08)]',
          'transition-all duration-150',
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
    secondary: 'bg-[#111e33] hover:bg-[#1a2d4a] text-[#94a3b8] hover:text-white border border-[#1e2f4a] hover:border-[#2a4166] transition-all',
    danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all',
    ghost:     'hover:bg-white/[.04] text-[#64748b] hover:text-white transition-all',
  }
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
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
