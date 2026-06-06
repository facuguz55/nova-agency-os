'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LogOut, ChevronRight, Settings } from 'lucide-react'
import TaskAlerts from '@/components/layout/TaskAlerts'
import { getCachedItems, mergeConfig, setCacheItems, type SidebarItem } from '@/lib/sidebar-config'

interface SidebarProps { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [items, setItems]         = useState<SidebarItem[]>(getCachedItems)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sidebar-config')
      .then(r => r.json())
      .then(({ items: stored }) => {
        if (!stored?.length) return
        const merged = mergeConfig(stored)
        setCacheItems(merged)
        setItems(merged)
      })
      .catch(() => {})

    const handler = () => setItems(getCachedItems())
    window.addEventListener('nova-sidebar-config', handler)

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })

    return () => window.removeEventListener('nova-sidebar-config', handler)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visible = items.filter(i => i.visible)

  const rendered: Array<{ type: 'label'; label: string } | { type: 'item'; item: SidebarItem }> = []
  let lastGroup = ''
  for (const item of visible) {
    if (item.group !== lastGroup) {
      rendered.push({ type: 'label', label: item.group })
      lastGroup = item.group
    }
    rendered.push({ type: 'item', item })
  }

  const initials    = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'NA'
  const displayName = userEmail ? userEmail.split('@')[0] : 'Usuario'

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r shrink-0 relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'bg-[#0a0a0a] border-[rgba(255,255,255,0.07)]',
        collapsed ? 'w-[56px]' : 'w-[220px]',
      )}
    >
      {/* Logo strip */}
      <div className={cn(
        'flex items-center h-[56px] border-b border-[rgba(255,255,255,0.07)] shrink-0 overflow-hidden',
        collapsed ? 'justify-center px-0' : 'px-4 gap-3',
      )}>
        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-[var(--amber-dim)]">
          <Image
            src="/logo-nova-dark.png"
            alt="Nova"
            width={28}
            height={28}
            className="object-cover w-full h-full"
          />
        </div>

        {!collapsed && (
          <span className="font-display text-[13px] font-700 text-white/90 tracking-tight truncate flex-1">
            Nova Agency OS
          </span>
        )}

        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-white/5 transition-all shrink-0"
          >
            <ChevronRight size={12} className="rotate-180" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-[#111] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--amber)] transition-colors z-10"
        >
          <ChevronRight size={10} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {rendered.map((row, i) => {
          if (row.type === 'label') {
            return !collapsed ? (
              <p
                key={`label-${i}`}
                className="px-2 mt-5 mb-1 first:mt-1 text-[9px] font-600 uppercase tracking-[0.12em] text-[var(--text-4)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {row.label}
              </p>
            ) : (
              <div key={`label-${i}`} className="mt-3 first:mt-1 border-t border-[rgba(255,255,255,0.05)] mx-2" />
            )
          }

          const { href, label, Icon } = row.item
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg text-[13px] transition-all duration-150 mb-px border-l-2',
                collapsed ? 'justify-center py-2.5 px-0' : 'px-2.5 py-2',
                active
                  ? 'nav-active font-medium'
                  : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-2)] hover:bg-white/[.035]',
              )}
            >
              <Icon size={14} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[rgba(255,255,255,0.07)] p-2 space-y-0.5">
        {/* User chip */}
        {userEmail && (
          <div className={cn(
            'flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1',
            collapsed && 'justify-center px-0',
          )}>
            <div className="w-6 h-6 rounded-md bg-[var(--amber-dim)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-700 text-[var(--amber)]" style={{ fontFamily: 'var(--font-display)' }}>{initials}</span>
            </div>
            {!collapsed && (
              <p className="text-[11px] font-medium text-[var(--text-3)] truncate">{displayName}</p>
            )}
          </div>
        )}

        <TaskAlerts collapsed={collapsed} />

        <Link
          href="/config"
          title={collapsed ? 'Configuración' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-lg text-[13px] text-[var(--text-4)] hover:text-[var(--text-2)] hover:bg-white/[.035] transition-all w-full border-l-2 border-transparent',
            collapsed ? 'justify-center py-2.5 px-0' : 'px-2.5 py-2',
          )}
        >
          <Settings size={14} className="shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </Link>

        <button
          onClick={logout}
          title={collapsed ? 'Salir' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-lg text-[13px] text-[var(--text-4)] hover:text-red-400 hover:bg-red-500/[.06] transition-all w-full',
            collapsed ? 'justify-center py-2.5 px-0' : 'px-2.5 py-2',
          )}
        >
          <LogOut size={14} className="shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  )
}
