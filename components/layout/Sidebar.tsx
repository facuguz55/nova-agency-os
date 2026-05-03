'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LogOut, Search, ChevronRight } from 'lucide-react'
import TaskAlerts from '@/components/layout/TaskAlerts'
import { getCachedItems, mergeConfig, setCacheItems, type SidebarItem } from '@/lib/sidebar-config'

interface SidebarProps { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<SidebarItem[]>(getCachedItems)

  useEffect(() => {
    // Fetch desde Supabase y actualizar cache
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
    return () => window.removeEventListener('nova-sidebar-config', handler)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visible = items.filter(i => i.visible)

  // Agrupar manteniendo orden del usuario, insertar label cuando cambia el grupo
  const rendered: Array<{ type: 'label'; label: string } | { type: 'item'; item: SidebarItem }> = []
  let lastGroup = ''
  for (const item of visible) {
    if (item.group !== lastGroup) {
      rendered.push({ type: 'label', label: item.group })
      lastGroup = item.group
    }
    rendered.push({ type: 'item', item })
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-[#1a2d45] bg-[#0c1628] transition-all duration-300 shrink-0 relative',
        collapsed ? 'w-[56px]' : 'w-[216px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 px-4 border-b border-[#1a2d45] shrink-0 gap-2.5',
        collapsed && 'justify-center px-0',
      )}>
        <div className="w-7 h-7 rounded-lg bg-[#f97316] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
            <circle cx="10" cy="13" r="2.2" fill="white"/>
          </svg>
        </div>
        {!collapsed && (
          <>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white leading-tight">Nova OS</span>
              <span className="text-[10px] text-[#334155] leading-tight">Agency</span>
            </div>
            <button onClick={onToggle} className="text-[#334155] hover:text-[#64748b] transition-colors p-1 rounded-md">
              <ChevronRight size={14} className="rotate-180" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-[#0c1628] border border-[#1a2d45] flex items-center justify-center text-[#64748b] hover:text-[#f97316] transition-colors z-10"
          >
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {rendered.map((row, i) => {
          if (row.type === 'label') {
            return !collapsed ? (
              <p key={`label-${i}`} className="px-2 mt-4 mb-1 first:mt-0 text-[10px] font-semibold uppercase tracking-widest text-[#253f60]">
                {row.label}
              </p>
            ) : (
              <div key={`label-${i}`} className="mt-3 first:mt-0 border-t border-[#1a2d45]/50 mx-2" />
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
                'flex items-center gap-3 rounded-lg text-sm transition-all duration-100 mb-px',
                collapsed ? 'justify-center py-2.5 px-0' : 'px-2 py-2',
                active
                  ? 'nav-active text-[#f97316] pl-3'
                  : 'text-[#4a6080] hover:text-[#94a3b8] hover:bg-white/[.03] border-l-2 border-transparent',
              )}
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#1a2d45] p-2 space-y-px">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title={collapsed ? 'Buscar' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm text-[#4a6080] hover:text-[#94a3b8] hover:bg-white/[.03] transition-all w-full',
            collapsed ? 'justify-center py-2.5 px-0' : 'px-2 py-2',
          )}
        >
          <Search size={15} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="font-medium flex-1 text-left">Buscar</span>
              <kbd className="text-[9px] bg-[#080f1e] border border-[#1a2d45] px-1.5 py-0.5 rounded text-[#334155]">⌘K</kbd>
            </>
          )}
        </button>
        <TaskAlerts collapsed={collapsed} />
        <button
          onClick={logout}
          title={collapsed ? 'Salir' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm text-[#4a6080] hover:text-red-400 hover:bg-red-500/[.06] transition-all w-full',
            collapsed ? 'justify-center py-2.5 px-0' : 'px-2 py-2',
          )}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span className="font-medium">Salir</span>}
        </button>
      </div>
    </aside>
  )
}
