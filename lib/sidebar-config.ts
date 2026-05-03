import {
  LayoutDashboard, MessageSquareText, Users, FolderKanban,
  Zap, Terminal, BarChart3, Server, Settings, ScrollText,
  CheckSquare, DollarSign, FileText, CalendarDays, Mail, TrendingUp,
  FileSignature, Brain, Target, type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href:  string
  label: string
  Icon:  LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const ALL_NAV_GROUPS: NavGroup[] = [
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

const STORAGE_KEY = 'nova_sidebar_hidden'

// Ítems ocultos por defecto (ninguno)
const DEFAULT_HIDDEN: string[] = []

export function getSidebarHidden(): string[] {
  if (typeof window === 'undefined') return DEFAULT_HIDDEN
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_HIDDEN
  } catch {
    return DEFAULT_HIDDEN
  }
}

export function setSidebarHidden(hrefs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hrefs))
  window.dispatchEvent(new Event('nova-sidebar-config'))
}

export function getVisibleGroups(hidden: string[]): NavGroup[] {
  return ALL_NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !hidden.includes(i.href)) }))
    .filter(g => g.items.length > 0)
}
