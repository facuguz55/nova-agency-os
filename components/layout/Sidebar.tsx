'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, MessageSquareText, Users, FolderKanban,
  Zap, Terminal, BarChart3, Server, Settings, ScrollText, LogOut,
  CheckSquare, DollarSign, FileText, CalendarDays, Mail, TrendingUp,
  FileSignature, Search, Brain,
} from 'lucide-react'
import TaskAlerts from '@/components/layout/TaskAlerts'

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { href: '/',     label: 'Dashboard', Icon: LayoutDashboard },
      { href: '/chat', label: 'IA Chat',   Icon: MessageSquareText },
    ],
  },
  {
    label: 'Trabajo',
    items: [
      { href: '/clients',  label: 'Clientes',  Icon: Users },
      { href: '/projects', label: 'Proyectos', Icon: FolderKanban },
      { href: '/tasks',    label: 'Tareas',    Icon: CheckSquare },
      { href: '/calendar', label: 'Calendario',Icon: CalendarDays },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/invoices',   label: 'Facturación', Icon: DollarSign },
      { href: '/notes',      label: 'Notas',       Icon: FileText },
      { href: '/templates',  label: 'Templates',   Icon: Mail },
      { href: '/proposals',  label: 'Propuestas',  Icon: FileSignature },
    ],
  },
  {
    label: 'Automatización',
    items: [
      { href: '/automations', label: 'Automatizaciones', Icon: Zap },
      { href: '/reports',     label: 'Reportes IA',      Icon: TrendingUp },
      { href: '/brain',       label: 'IA Brain',         Icon: Brain },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/n8n-logs', label: 'n8n Logs',      Icon: Terminal },
      { href: '/metrics',  label: 'Métricas',       Icon: BarChart3 },
      { href: '/servers',  label: 'Servidores',     Icon: Server },
      { href: '/audit',    label: 'Audit Log',      Icon: ScrollText },
      { href: '/config',   label: 'Configuración',  Icon: Settings },
    ],
  },
]

interface SidebarProps { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r transition-all duration-300 relative',
        'bg-[#0a1525] border-[#1e2f4a]',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Ambient glow top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#ff8c42]/5 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[#1e2f4a] shrink-0 gap-3',
        collapsed && 'justify-center px-0',
      )}>
        {/* Nova logo mark */}
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] flex items-center justify-center shadow-[0_0_16px_rgba(255,140,66,.5)]">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="10" cy="13" r="2.5" fill="white" opacity=".9"/>
            </svg>
          </div>
        </div>

        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white leading-tight">Nova OS</span>
            <span className="text-[10px] text-[#ff8c42]/60 leading-tight tracking-widest uppercase">Agency</span>
          </div>
        )}

        <button
          onClick={onToggle}
          className={cn(
            'ml-auto text-[#334155] hover:text-[#ff8c42] transition-colors p-1 rounded-lg hover:bg-[#ff8c42]/10',
            collapsed && 'ml-0 hidden',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 text-[#334155] hover:text-[#ff8c42] transition-colors p-1.5 rounded-lg hover:bg-[#ff8c42]/10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[9px] font-semibold uppercase tracking-widest text-[#1e3a5f]">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl text-sm transition-all duration-150 group',
                      collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
                      active
                        ? 'nav-active text-[#ff8c42]'
                        : 'text-[#475569] hover:text-[#94a3b8] hover:bg-white/[.03] border border-transparent',
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-all duration-150',
                        active
                          ? 'text-[#ff8c42] drop-shadow-[0_0_6px_rgba(255,140,66,.8)]'
                          : 'text-[#334155] group-hover:text-[#64748b]',
                      )}
                    />
                    {!collapsed && (
                      <span className={cn('truncate font-medium', active ? 'text-[#ff8c42]' : '')}>
                        {label}
                      </span>
                    )}
                    {active && !collapsed && (
                      <div className="ml-auto w-1 h-4 rounded-full bg-[#ff8c42] shadow-[0_0_8px_rgba(255,140,66,.8)]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#1e2f4a] p-2 space-y-0.5">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title={collapsed ? 'Buscar' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm text-[#334155]',
            'hover:bg-[#ff8c42]/10 hover:text-[#ff8c42] transition-all w-full group',
            collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
          )}
        >
          <Search size={15} className="shrink-0" />
          {!collapsed && <span className="font-medium">Buscar</span>}
          {!collapsed && <kbd className="ml-auto text-[9px] bg-[#080f1e] border border-[#1e2f4a] px-1.5 py-0.5 rounded text-[#1e3a5f]">Ctrl K</kbd>}
        </button>

        <TaskAlerts collapsed={collapsed} />

        <button
          onClick={logout}
          title={collapsed ? 'Salir' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm text-[#334155]',
            'hover:bg-red-500/10 hover:text-red-400 transition-all w-full group',
            collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
          )}
        >
          <LogOut size={15} className="shrink-0 group-hover:drop-shadow-[0_0_4px_rgba(239,68,68,.6)]" />
          {!collapsed && <span className="font-medium">Salir</span>}
        </button>
      </div>
    </aside>
  )
}
