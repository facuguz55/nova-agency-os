'use client'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#1e2f4a] shrink-0 bg-[#080f1e]/80 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-base font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#475569] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
