import {
  LayoutDashboard, MessageSquareText, Users, FolderKanban,
  Zap, Terminal, Settings, ScrollText,
  CheckSquare, DollarSign, FileText, CalendarDays,
  Brain, Inbox, Scissors, Lightbulb, Video, type LucideIcon,
} from 'lucide-react'

export interface SidebarItem {
  href:    string
  label:   string
  Icon:    LucideIcon
  group:   string
  visible: boolean
}

// Lista canónica de todos los ítems con su orden por defecto
export const ALL_ITEMS: Omit<SidebarItem, 'visible'>[] = [
  { href: '/',             label: 'Dashboard',       Icon: LayoutDashboard,   group: 'General' },
  { href: '/chat',         label: 'IA Chat',          Icon: MessageSquareText, group: 'General' },
  { href: '/clients',      label: 'Clientes',         Icon: Users,             group: 'Trabajo' },
  { href: '/projects',     label: 'Proyectos',        Icon: FolderKanban,      group: 'Trabajo' },
  { href: '/videos',       label: 'Videos',           Icon: Video,             group: 'Trabajo' },
  { href: '/tasks',        label: 'Tareas',           Icon: CheckSquare,       group: 'Trabajo' },
  { href: '/calendar',     label: 'Calendario',       Icon: CalendarDays,      group: 'Trabajo' },
  { href: '/invoices',     label: 'Facturación',      Icon: DollarSign,        group: 'Negocio' },
  { href: '/solicitudes',  label: 'Solicitudes',      Icon: Inbox,             group: 'Negocio' },
  { href: '/notes',        label: 'Notas',            Icon: FileText,          group: 'Negocio' },
  { href: '/snippets',    label: 'Snippets',         Icon: Scissors,          group: 'Negocio' },
  { href: '/ideas',      label: 'Ideas',            Icon: Lightbulb,         group: 'Negocio' },
  { href: '/automations',  label: 'Automatizaciones', Icon: Zap,               group: 'Automatización' },
  { href: '/brain',        label: 'IA Brain',         Icon: Brain,             group: 'Automatización' },
  { href: '/n8n-logs',     label: 'n8n Logs',         Icon: Terminal,          group: 'Sistema' },
  { href: '/audit',        label: 'Audit Log',        Icon: ScrollText,        group: 'Sistema' },
  { href: '/config',       label: 'Configuración',    Icon: Settings,          group: 'Sistema' },
]

export type StoredItem = { href: string; visible: boolean }

const CACHE_KEY = 'nova_sidebar_items'

export function getDefaultItems(): SidebarItem[] {
  return ALL_ITEMS.map(i => ({ ...i, visible: true }))
}

// Merge stored order/visibility with canonical list (por si se agregan ítems nuevos)
export function mergeConfig(stored: StoredItem[]): SidebarItem[] {
  const storedMap = new Map(stored.map(s => [s.href, s]))
  const result: SidebarItem[] = []

  // Ítems en el orden guardado
  for (const s of stored) {
    const canonical = ALL_ITEMS.find(i => i.href === s.href)
    if (canonical) result.push({ ...canonical, visible: s.visible })
  }

  // Ítems nuevos que no estaban en el stored (al final)
  for (const canonical of ALL_ITEMS) {
    if (!storedMap.has(canonical.href)) {
      result.push({ ...canonical, visible: true })
    }
  }

  return result
}

export function getCachedItems(): SidebarItem[] {
  if (typeof window === 'undefined') return getDefaultItems()
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return getDefaultItems()
    return mergeConfig(JSON.parse(raw))
  } catch {
    return getDefaultItems()
  }
}

export function setCacheItems(items: SidebarItem[]) {
  if (typeof window === 'undefined') return
  const stored: StoredItem[] = items.map(i => ({ href: i.href, visible: i.visible }))
  localStorage.setItem(CACHE_KEY, JSON.stringify(stored))
  window.dispatchEvent(new Event('nova-sidebar-config'))
}
