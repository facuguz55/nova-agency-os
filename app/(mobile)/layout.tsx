'use client'

import { useEffect } from 'react'
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

const NAV_H   = 56   // px altura bottom nav (sin safe area)
const SAFE_B  = 'env(safe-area-inset-bottom)'
const SAFE_T  = 'env(safe-area-inset-top)'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Evita que iOS mueva el viewport cuando aparece/oculta la barra de direcciones
  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width:    document.body.style.width,
      height:   document.body.style.height,
    }
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
    <div
      className="fixed inset-0 flex flex-col bg-[#080f1e]"
      style={{ WebkitOverflowScrolling: 'auto' } as React.CSSProperties}
    >
      {/* Contenido — ocupa todo menos el bottom nav */}
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ paddingBottom: `calc(${NAV_H}px + ${SAFE_B})` }}
      >
        {children}
      </main>

      {/* Bottom nav — fijo al fondo */}
      <nav
        className="absolute bottom-0 left-0 right-0 bg-[#0c1628] border-t border-[#1a2d45] flex items-center"
        style={{ height: `calc(${NAV_H}px + ${SAFE_B})`, paddingBottom: SAFE_B }}
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/m' ? pathname === '/m' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors',
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
