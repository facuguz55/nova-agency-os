'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, CheckSquare, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/m',           label: 'Inicio',     Icon: LayoutDashboard, exact: true },
  { href: '/m/chat',      label: 'Chat IA',    Icon: MessageSquare },
  { href: '/m/tareas',    label: 'Tareas',     Icon: CheckSquare },
  { href: '/m/proyectos', label: 'Proyectos',  Icon: FolderKanban },
]

const NAV_H  = 60
const SAFE_B = 'env(safe-area-inset-bottom)'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const prev = { overflow: document.body.style.overflow, position: document.body.style.position, width: document.body.style.width, height: document.body.style.height }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width    = '100%'
    document.body.style.height   = '100%'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.position = prev.position
      document.body.style.width    = prev.width
      document.body.style.height   = prev.height
    }
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-[#080f1e]" style={{ WebkitOverflowScrolling: 'auto' } as React.CSSProperties}>
      <main className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: `calc(${NAV_H}px + ${SAFE_B})` }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="absolute bottom-0 left-0 right-0 bg-[#0c1628]/95 backdrop-blur-md border-t border-[#1a2d45] flex items-center"
        style={{ height: `calc(${NAV_H}px + ${SAFE_B})`, paddingBottom: SAFE_B }}
      >
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all',
                active ? 'text-[#f97316]' : 'text-[#334155]',
              )}>
              <div className={cn('w-8 h-8 flex items-center justify-center rounded-xl transition-all', active && 'bg-[#f97316]/15')}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn('text-[9px] font-semibold tracking-wide', active ? 'text-[#f97316]' : 'text-[#334155]')}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
