'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, MessageSquareText, Users, FolderKanban,
  Zap, Terminal, BarChart3, Server, Settings, ScrollText, LogOut,
  CheckSquare, DollarSign, FileText, CalendarDays, Mail, TrendingUp,
  FileSignature, Search, Brain, Target, ChevronRight,
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
      { href: '/clients',  label: 'Clientes',   Icon: Users },
      { href: '/projects', label: 'Proyectos',  Icon: FolderKanban },
      { href: '/tasks',    label: 'Tareas',     Icon: CheckSquare },
      { href: '/calendar', label: 'Calendario', Icon: CalendarDays },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/invoices',    label: 'Facturación', Icon: DollarSign },
      { href: '/notes',       label: 'Notas',       Icon: FileText },
      { href: '/templates',   label: 'Templates',   Icon: Mail },
      { href: '/proposals',   label: 'Propuestas',  Icon: FileSignature },
      { href: '/prospeccion', label: 'Prospección', Icon: Target },
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
      { href: '/n8n-logs', label: 'n8n Logs',     Icon: Terminal },
      { href: '/metrics',  label: 'Métricas',      Icon: BarChart3 },
      { href: '/servers',  label: 'Servidores',    Icon: Server },
      { href: '/audit',    label: 'Audit Log',     Icon: ScrollText },
      { href: '/config',   label: 'Configuración', Icon: Settings },
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
        'flex flex-col h-full border-r border-[#1a2d45] bg-[#0c1628] transition-all duration-300 shrink-0',
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
            <button
              onClick={onToggle}
              className="text-[#334155] hover:text-[#64748b] transition-colors p-1 rounded-md"
            >
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
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#253f60]">
                {group.label}
              </p>
            )}
            <div className="space-y-px">
              {group.items.map(({ href, label, Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm transition-all duration-100',
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
            </div>
          </div>
        ))}
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
