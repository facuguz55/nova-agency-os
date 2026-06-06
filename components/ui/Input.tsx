import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-medium text-[var(--text-3)] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2.5 text-[13px] rounded-xl text-[var(--text)] placeholder-[var(--text-4)]',
          'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
          'focus:outline-none focus:border-[rgba(245,158,11,0.4)] focus:ring-2 focus:ring-[rgba(245,158,11,0.08)]',
          'transition-all duration-150',
          error && 'border-red-500/40',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}
export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-medium text-[var(--text-3)] uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2.5 text-[13px] rounded-xl text-[var(--text)]',
          'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
          'focus:outline-none focus:border-[rgba(245,158,11,0.4)] focus:ring-2 focus:ring-[rgba(245,158,11,0.08)]',
          'transition-all duration-150',
          error && 'border-red-500/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-medium text-[var(--text-3)] uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2.5 text-[13px] rounded-xl text-[var(--text)] placeholder-[var(--text-4)] resize-none',
          'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
          'focus:outline-none focus:border-[rgba(245,158,11,0.4)] focus:ring-2 focus:ring-[rgba(245,158,11,0.08)]',
          'transition-all duration-150',
          error && 'border-red-500/40',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

export function Button({
  children, variant = 'primary', size = 'md', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const variants: Record<Variant, string> = {
    primary:   'btn-primary text-black',
    secondary: 'bg-white/[.05] hover:bg-white/[.08] text-[var(--text-2)] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] transition-all',
    danger:    'bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/15 hover:border-red-500/25 transition-all',
    ghost:     'hover:bg-white/[.04] text-[var(--text-3)] hover:text-[var(--text-2)] transition-all',
  }
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-[12px] rounded-lg',
    md: 'px-4 py-2 text-[13px] rounded-xl',
    lg: 'px-5 py-2.5 text-[13px] rounded-xl',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-medium disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
