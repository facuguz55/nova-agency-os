'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, CheckSquare, FolderKanban, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/m',           label: 'Inicio',    Icon: LayoutDashboard, exact: true },
  { href: '/m/chat',      label: 'Chat IA',   Icon: MessageSquare },
  { href: '/m/tareas',    label: 'Tareas',    Icon: CheckSquare },
  { href: '/m/proyectos', label: 'Proyectos', Icon: FolderKanban },
  { href: '/m/clientes',  label: 'Clientes',  Icon: Users },
]

const NAV_H  = 64
const SAFE_B = 'env(safe-area-inset-bottom)'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        .mobile-app { font-family: 'DM Sans', sans-serif; }
        .mobile-title { font-family: 'Syne', sans-serif; }
        .mobile-mono  { font-family: 'DM Mono', monospace; }
      `}</style>

      <div className="mobile-app fixed inset-0 flex flex-col" style={{ background: '#07101f' }}>
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ paddingBottom: `calc(${NAV_H}px + ${SAFE_B})` }}
        >
          {children}
        </main>

        {/* Bottom nav */}
        <nav
          className="absolute bottom-0 left-0 right-0 flex items-center"
          style={{
            height: `calc(${NAV_H}px + ${SAFE_B})`,
            paddingBottom: SAFE_B,
            background: 'rgba(7,16,31,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full relative"
              >
                {/* Active indicator dot */}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                    style={{ background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.6)' }}
                  />
                )}
                <div
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-2xl transition-all duration-200',
                    active
                      ? 'text-[#f97316]'
                      : 'text-white/20'
                  )}
                  style={active ? { background: 'rgba(249,115,22,0.1)' } : {}}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                </div>
                <span
                  className="mobile-title text-[9px] font-bold tracking-widest uppercase leading-none"
                  style={{ color: active ? '#f97316' : 'rgba(255,255,255,0.2)' }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
