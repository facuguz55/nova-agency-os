import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm text-[#94a3b8]">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-[#475569] text-sm',
          'focus:outline-none focus:border-[#ff8c42] transition-colors',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
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
      {label && <label className="block text-sm text-[#94a3b8]">{label}</label>}
      <select
        className={cn(
          'w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-white text-sm',
          'focus:outline-none focus:border-[#ff8c42] transition-colors',
          error && 'border-red-500/50',
          className
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
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm text-[#94a3b8]">{label}</label>}
      <textarea
        className={cn(
          'w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-[#475569] text-sm resize-none',
          'focus:outline-none focus:border-[#ff8c42] transition-colors',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants = {
    primary: 'bg-[#ff8c42] hover:bg-[#ff8c42]/90 text-white',
    secondary: 'bg-[#334155] hover:bg-[#475569] text-white border border-[#475569]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
    ghost: 'hover:bg-[#334155] text-[#94a3b8] hover:text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
