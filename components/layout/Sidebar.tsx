'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/chat', label: 'IA Chat', icon: '◈' },
  { href: '/clients', label: 'Clientes', icon: '◉' },
  { href: '/projects', label: 'Proyectos', icon: '◫' },
  { href: '/automations', label: 'Automatizaciones', icon: '◎' },
  { href: '/n8n-logs', label: 'n8n Logs', icon: '◑' },
  { href: '/metrics', label: 'Métricas', icon: '◈' },
  { href: '/servers', label: 'Servidores', icon: '◻' },
  { href: '/audit', label: 'Audit Log', icon: '◒' },
  { href: '/config', label: 'Configuración', icon: '◌' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#1e293b] border-r border-[#334155] transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-[#334155] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#ff8c42]/10 border border-[#ff8c42]/30 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <polygon points="16,2 30,28 2,28" fill="none" stroke="#ff8c42" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="16" cy="20" r="3" fill="#a855f7"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-white truncate">Nova OS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-[#ff8c42]/10 border border-[#ff8c42]/30 flex items-center justify-center mx-auto">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="none" stroke="#ff8c42" strokeWidth="2.5" strokeLinejoin="round"/>
              <circle cx="16" cy="20" r="3" fill="#a855f7"/>
            </svg>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-[#475569] hover:text-white transition-colors p-1 rounded"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                isActive
                  ? 'bg-[#ff8c42]/10 text-[#ff8c42] border border-[#ff8c42]/20'
                  : 'text-[#94a3b8] hover:bg-[#334155]/50 hover:text-white border border-transparent'
              )}
            >
              <span className={cn('text-lg leading-none shrink-0', isActive ? 'text-[#ff8c42]' : 'text-[#475569] group-hover:text-white')}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#334155] p-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#475569] hover:bg-red-500/10 hover:text-red-400 transition-all w-full',
            collapsed && 'justify-center'
          )}
        >
          <span className="text-base">⇥</span>
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  )
}
