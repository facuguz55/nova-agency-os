'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Mic, FolderKanban, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/m',           label: 'Chat',      Icon: MessageSquare },
  { href: '/m/notas',     label: 'Notas',     Icon: Mic },
  { href: '/m/proyectos', label: 'Proyectos', Icon: FolderKanban },
  { href: '/m/tareas',    label: 'Tareas',    Icon: CheckSquare },
]

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-dvh bg-[#080f1e] overflow-hidden">
      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="shrink-0 bg-[#0c1628] border-t border-[#1a2d45] flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/m' ? pathname === '/m' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                active ? 'text-[#f97316]' : 'text-[#334155]',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
