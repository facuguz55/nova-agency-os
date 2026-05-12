'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [items, setItems]   = useState<SidebarItem[]>(getCachedItems)
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

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U'
  const displayName = userEmail ? userEmail.split('@')[0] : 'Usuario'

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-[#1a2d45] bg-[#0c1628] transition-all duration-300 shrink-0 relative',
        collapsed ? 'w-[56px]' : 'w-[216px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 px-3 border-b border-[#1a2d45] shrink-0 gap-2',
        collapsed && 'justify-center px-0',
      )}>
        {collapsed ? (
          <>
            <Image
              src="/logo-nova-clear.png"
              alt="Nova Agency"
              width={32}
              height={32}
              className="object-contain rounded-xl shrink-0"
            />
            <button
              onClick={onToggle}
              className="absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-[#0c1628] border border-[#1a2d45] flex items-center justify-center text-[#64748b] hover:text-[#f97316] transition-colors z-10"
            >
              <ChevronRight size={11} />
            </button>
          </>
        ) : (
          <>
            <Image
              src="/logo-nova-clear.png"
              alt="Nova Agency"
              width={32}
              height={32}
              className="object-contain rounded-xl shrink-0"
            />
            <span className="text-sm font-bold text-white/90 truncate">Nova Agency</span>
            <button onClick={onToggle} className="text-[#334155] hover:text-[#64748b] transition-colors p-1 rounded-md shrink-0">
              <ChevronRight size={14} className="rotate-180" />
            </button>
          </>
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
        {/* Usuario logueado */}
        {userEmail && (
          <div className={cn(
            'flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1',
            collapsed && 'justify-center px-0',
          )}>
            <div className="w-6 h-6 rounded-md bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-[#f97316]">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#64748b] truncate">{displayName}</p>
              </div>
            )}
          </div>
        )}

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
