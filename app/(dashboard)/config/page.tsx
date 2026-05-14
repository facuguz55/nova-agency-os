'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { GripVertical } from 'lucide-react'
import {
  getCachedItems, getDefaultItems, mergeConfig, setCacheItems,
  type SidebarItem, type StoredItem,
} from '@/lib/sidebar-config'

interface TeamMember {
  id: string; name: string; email: string; role: string; status: string; created_at: string; whatsapp: string | null
}

const INTEGRATIONS = [
  { name: 'Supabase',          status: 'connected'      },
  { name: 'Claude AI (Haiku)', status: 'connected'      },
  { name: 'n8n',               status: 'connected'      },
  { name: 'Gmail API',         status: 'disconnected'   },
  { name: 'Instagram API',     status: 'not_configured' },
  { name: 'YouTube API',       status: 'not_configured' },
  { name: 'TikTok API',        status: 'not_configured' },
] as const

const INT_STYLE = {
  connected:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disconnected:   'bg-red-500/10 text-red-400 border-red-500/20',
  not_configured: 'bg-[#1a2d45] text-[#4a6080] border-[#1a2d45]',
}
const INT_LABEL = {
  connected:      'Conectado',
  disconnected:   'Desconectado',
  not_configured: 'Sin configurar',
}

export default function ConfigPage() {
  /* ── Equipo ─────────────────────────────────────── */
  usePageTitle('Configuración')
  const [team, setTeam]             = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [form, setForm]             = useState({ name: '', email: '', role: 'user', whatsapp: '' })
  const [saving, setSaving]         = useState(false)

  /* ── Sidebar config ─────────────────────────────── */
  const [items, setItems]       = useState<SidebarItem[]>(getCachedItems)
  const [savingBar, setSavingBar] = useState(false)
  const [saved, setSaved]       = useState(false)

  /* ── Drag & drop state ──────────────────────────── */
  const dragIdx   = useRef<number | null>(null)
  const dragOver  = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropAt,   setDropAt]   = useState<number | null>(null)

  useEffect(() => {
    loadTeam()
    // Cargar config desde Supabase
    fetch('/api/sidebar-config')
      .then(r => r.json())
      .then(({ items: stored }) => {
        if (stored?.length) setItems(mergeConfig(stored))
      })
      .catch(() => {})
  }, [])

  async function loadTeam() {
    setLoadingTeam(true)
    const { createClient } = await import('@/lib/supabase/client')
    const s = createClient()
    const { data } = await s.from('team_members').select('*').order('created_at')
    setTeam(data || [])
    setLoadingTeam(false)
  }

  function openAdd() {
    setEditMember(null)
    setForm({ name: '', email: '', role: 'user', whatsapp: '' })
    setShowModal(true)
  }

  function openEdit(m: TeamMember) {
    setEditMember(m)
    setForm({ name: m.name, email: m.email, role: m.role, whatsapp: m.whatsapp || '' })
    setShowModal(true)
  }

  async function saveMember() {
    if (!form.name.trim()) return
    setSaving(true)
    const { createClient } = await import('@/lib/supabase/client')
    const s = createClient()
    const payload = {
      name:      form.name.trim(),
      email:     form.email.trim(),
      role:      form.role,
      whatsapp:  form.whatsapp.trim() || null,
    }
    if (editMember) {
      await s.from('team_members').update(payload).eq('id', editMember.id)
    } else {
      await s.from('team_members').insert(payload)
    }
    setShowModal(false)
    setEditMember(null)
    setForm({ name: '', email: '', role: 'user', whatsapp: '' })
    setSaving(false)
    loadTeam()
  }

  async function deleteMember(m: TeamMember) {
    if (!confirm(`¿Eliminar a ${m.name} del equipo?`)) return
    const { createClient } = await import('@/lib/supabase/client')
    const s = createClient()
    await s.from('team_members').delete().eq('id', m.id)
    loadTeam()
  }

  async function toggleStatus(m: TeamMember) {
    const { createClient } = await import('@/lib/supabase/client')
    const s = createClient()
    await s.from('team_members').update({ status: m.status === 'active' ? 'inactive' : 'active' }).eq('id', m.id)
    loadTeam()
  }

  /* ── Drag handlers ──────────────────────────────── */
  function onDragStart(e: React.DragEvent, idx: number) {
    dragIdx.current = idx
    setDragging(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    dragOver.current = idx
    setDropAt(idx)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIdx.current
    const to   = dragOver.current
    if (from === null || to === null || from === to) {
      setDragging(null); setDropAt(null); return
    }
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
    setDragging(null)
    setDropAt(null)
    dragIdx.current  = null
    dragOver.current = null
  }

  function onDragEnd() {
    setDragging(null)
    setDropAt(null)
    dragIdx.current  = null
    dragOver.current = null
  }

  function toggleVisible(href: string) {
    if (href === '/config') return
    setItems(prev => prev.map(i => i.href === href ? { ...i, visible: !i.visible } : i))
  }

  async function saveConfig() {
    setSavingBar(true)
    const stored: StoredItem[] = items.map(i => ({ href: i.href, visible: i.visible }))
    setCacheItems(items)
    await fetch('/api/sidebar-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: stored }),
    })
    setSavingBar(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function resetConfig() {
    const defaults = getDefaultItems()
    setItems(defaults)
    setCacheItems(defaults)
    fetch('/api/sidebar-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: defaults.map(i => ({ href: i.href, visible: i.visible })) }),
    })
  }

  return (
    <>
      <Header title="Configuración" subtitle="Sidebar, equipo, integraciones y credenciales" />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a2d45] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Sidebar</h3>
              <p className="text-xs text-[#4a6080] mt-0.5">Arrastrá para reordenar · Toggle para mostrar/ocultar</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetConfig}
                className="text-xs text-[#4a6080] hover:text-[#94a3b8] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[.03]"
              >
                Restaurar
              </button>
              <Button size="sm" onClick={saveConfig} disabled={savingBar}>
                {saved ? '✓ Guardado' : savingBar ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-1">
            {items.map((item, idx) => {
              const isDragging  = dragging === idx
              const isDropZone  = dropAt === idx && dragging !== null && dragging !== idx
              const isConfig    = item.href === '/config'

              return (
                <div
                  key={item.href}
                  draggable
                  onDragStart={e => onDragStart(e, idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-100 cursor-default select-none ${
                    isDragging
                      ? 'opacity-40 bg-[#1a2d45] border-[#253f60]'
                      : isDropZone
                        ? 'border-[#f97316]/40 bg-[#f97316]/5'
                        : 'bg-[#080f1e] border-[#1a2d45] hover:border-[#253f60]'
                  }`}
                >
                  {/* Drag handle */}
                  <GripVertical size={14} className="text-[#253f60] shrink-0 cursor-grab active:cursor-grabbing" />

                  {/* Icono + label + grupo */}
                  <item.Icon size={14} className={item.visible ? 'text-[#64748b]' : 'text-[#253f60]'} />
                  <span className={`text-sm font-medium flex-1 ${item.visible ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-[#253f60] mr-2">{item.group}</span>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleVisible(item.href)}
                    disabled={isConfig}
                    title={isConfig ? 'Siempre visible' : undefined}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
                      isConfig
                        ? 'opacity-40 cursor-not-allowed bg-[#f97316]'
                        : item.visible
                          ? 'bg-[#f97316] cursor-pointer'
                          : 'bg-[#1a2d45] cursor-pointer'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                      item.visible ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Equipo ────────────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Equipo</h3>
            <Button size="sm" onClick={openAdd}>+ Agregar</Button>
          </div>
          {loadingTeam ? (
            <p className="text-sm text-[#4a6080]">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {team.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-[#080f1e] border border-[#1a2d45] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-sm font-bold text-[#f97316]">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-[#4a6080]">
                        {m.email}{m.role ? ` · ${m.role}` : ''}
                        {m.whatsapp && <span className="text-emerald-500/60"> · WA: {m.whatsapp}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs px-2.5 py-1 bg-[#1a2d45] hover:bg-[#253f60] text-[#94a3b8] hover:text-white rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleStatus(m)}
                      className="text-xs px-2.5 py-1 bg-[#1a2d45] hover:bg-[#253f60] text-[#94a3b8] hover:text-white rounded-lg transition-colors"
                    >
                      {m.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => deleteMember(m)}
                      className="text-xs px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Integraciones ─────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Integraciones</h3>
          <div className="space-y-2">
            {INTEGRATIONS.map(i => (
              <div key={i.name} className="flex items-center justify-between p-3 bg-[#080f1e] border border-[#1a2d45] rounded-lg">
                <span className="text-sm text-[#94a3b8]">{i.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${INT_STYLE[i.status]}`}>
                  {INT_LABEL[i.status]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Vault ─────────────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Vault de credenciales</h3>
          <p className="text-xs text-[#4a6080] mb-4">Las API keys están en variables de entorno de Vercel. Los valores nunca se muestran.</p>
          <div className="space-y-1.5">
            {[
              'ANTHROPIC_API_KEY', 'N8N_API_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
              'GMAIL_CLIENT_SECRET', 'INSTAGRAM_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'TIKTOK_ACCESS_TOKEN',
            ].map(key => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#080f1e] border border-[#1a2d45] rounded-lg">
                <span className="text-xs font-mono text-[#64748b]">{key}</span>
                <span className="text-xs text-[#253f60] font-mono tracking-widest">••••••••</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editMember ? 'Editar miembro' : 'Agregar miembro'}>
        <div className="space-y-4">
          {!editMember && (
            <p className="text-xs text-[#4a6080]">
              Para acceso al sistema usá "Invite user" en Supabase Auth. Acá solo registrás el miembro en la tabla del equipo.
            </p>
          )}
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Juan García"
          />
          <Input
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            type="email"
            placeholder="juan@email.com"
          />
          <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">Usuario</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </Select>
          <Input
            label="WhatsApp (sin + ni espacios)"
            value={form.whatsapp}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            placeholder="5491112345678"
          />
          <div className="flex gap-2 pt-1">
            <Button onClick={saveMember} disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando...' : editMember ? 'Guardar cambios' : 'Agregar'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
