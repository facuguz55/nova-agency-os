'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  GripVertical, Building2, Save, Upload, Sun, Moon,
  Users, PanelLeft, Plug, KeyRound, Palette, Pencil, Trash2, Power,
} from 'lucide-react'
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

const INT_META = {
  connected:      { label: 'Conectado',      color: '#34d399' },
  disconnected:   { label: 'Desconectado',   color: '#f87171' },
  not_configured: { label: 'Sin configurar', color: '#616161' },
}

const ROW = { background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10 }

function SectionHeader({ icon, title, sub, color = '#f59e0b', actions }: {
  icon: React.ReactNode; title: string; sub?: string; color?: string; actions?: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}30`, color, boxShadow: `0 0 14px ${color}18` }}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
          {sub && <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{sub}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

export default function ConfigPage() {
  usePageTitle('Configuración')
  const profileRef = useRef<HTMLElement>(null)

  const [profile, setProfile]             = useState({ agency_name: '', agency_tagline: '', agency_logo: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile]   = useState(false)
  const [userEmail, setUserEmail]         = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const [team, setTeam]               = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editMember, setEditMember]   = useState<TeamMember | null>(null)
  const [form, setForm]               = useState({ name: '', email: '', role: 'user', whatsapp: '' })
  const [saving, setSaving]           = useState(false)

  const [items, setItems]         = useState<SidebarItem[]>(getCachedItems)
  const [savingBar, setSavingBar] = useState(false)
  const [saved, setSaved]         = useState(false)

  const dragIdx   = useRef<number | null>(null)
  const dragOver  = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dropAt,   setDropAt]   = useState<number | null>(null)

  useEffect(() => {
    loadTeam()
    fetch('/api/sidebar-config')
      .then(r => r.json())
      .then(({ items: stored }) => { if (stored?.length) setItems(mergeConfig(stored)) })
      .catch(() => {})
    fetch('/api/app-config')
      .then(r => r.json())
      .then(cfg => setProfile({ agency_name: cfg.agency_name || '', agency_tagline: cfg.agency_tagline || '', agency_logo: cfg.agency_logo || '' }))
      .catch(() => {})
    try { setTheme((localStorage.getItem('nova-theme') as 'dark' | 'light') || 'dark') } catch {}
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      setUserEmail(data.user?.email || '')
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'perfil' && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('nova-theme', next) } catch {}
    document.documentElement.dataset.theme = next
  }

  async function saveProfile() {
    setSavingProfile(true)
    await fetch('/api/app-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setSavingProfile(false); setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

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
    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, whatsapp: form.whatsapp.trim() || null }
    if (editMember) {
      await s.from('team_members').update(payload).eq('id', editMember.id)
    } else {
      await s.from('team_members').insert(payload)
    }
    setShowModal(false); setEditMember(null)
    setForm({ name: '', email: '', role: 'user', whatsapp: '' })
    setSaving(false); loadTeam()
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

  function onDragStart(e: React.DragEvent, idx: number) {
    dragIdx.current = idx; setDragging(idx); e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault(); dragOver.current = idx; setDropAt(idx)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIdx.current; const to = dragOver.current
    if (from === null || to === null || from === to) { setDragging(null); setDropAt(null); return }
    const next = [...items]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved)
    setItems(next); setDragging(null); setDropAt(null); dragIdx.current = null; dragOver.current = null
  }
  function onDragEnd() {
    setDragging(null); setDropAt(null); dragIdx.current = null; dragOver.current = null
  }
  function toggleVisible(href: string) {
    if (href === '/config') return
    setItems(prev => prev.map(i => i.href === href ? { ...i, visible: !i.visible } : i))
  }
  async function saveConfig() {
    setSavingBar(true)
    const stored: StoredItem[] = items.map(i => ({ href: i.href, visible: i.visible }))
    setCacheItems(items)
    await fetch('/api/sidebar-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: stored }) })
    setSavingBar(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  function resetConfig() {
    const defaults = getDefaultItems(); setItems(defaults); setCacheItems(defaults)
    fetch('/api/sidebar-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: defaults.map(i => ({ href: i.href, visible: i.visible })) }) })
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-colors'
  const inputStyle = { background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text)' }

  const visibleCount = items.filter(i => i.visible).length

  return (
    <>
      <Header title="Configuración" subtitle="Identidad, sidebar, equipo e integraciones" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">

          {/* ════ Columna principal ════ */}
          <div className="xl:col-span-3 space-y-5">

            {/* ── Perfil de la Agencia ── */}
            <section ref={profileRef} className="panel-neon overflow-hidden animate-fade-up">
              <SectionHeader
                icon={<Building2 size={15}/>}
                title="Perfil de la Agencia"
                sub="Nombre, logo e identidad que aparecen en el header y el portal"
                actions={
                  <Button size="sm" onClick={saveProfile} disabled={savingProfile}>
                    {savedProfile ? '✓ Guardado' : savingProfile ? 'Guardando...' : <><Save size={12}/> Guardar</>}
                  </Button>
                }
              />

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center relative group"
                    style={{ background: 'var(--surface-0)', border: '2px solid var(--border)', boxShadow: '0 0 20px rgba(255,255,255,0.04)' }}>
                    {profile.agency_logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.agency_logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-[var(--text-4)]">
                        <Upload size={20} />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Sin logo</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full p-3 rounded-xl text-center" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                    <p className="text-[9px] text-[var(--text-4)] uppercase tracking-widest mb-1">Usuario activo</p>
                    <p className="text-xs text-[var(--text-3)] truncate">{userEmail || '—'}</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-3)]">Nombre de la agencia</label>
                    <input value={profile.agency_name} onChange={e => setProfile(p => ({ ...p, agency_name: e.target.value }))}
                      placeholder="Nova Agency" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-3)]">Tagline / descripción corta</label>
                    <input value={profile.agency_tagline} onChange={e => setProfile(p => ({ ...p, agency_tagline: e.target.value }))}
                      placeholder="Marketing digital · Automatización · Resultados" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-3)]">URL del logo</label>
                    <input value={profile.agency_logo} onChange={e => setProfile(p => ({ ...p, agency_logo: e.target.value }))}
                      placeholder="https://..." className={`${inputCls} font-mono text-xs`} style={inputStyle} />
                    <p className="text-[10px] text-[var(--text-4)]">Subí tu logo a imgur.com o cualquier hosting de imágenes y pegá la URL directa</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Sidebar ── */}
            <section className="panel-neon overflow-hidden animate-fade-up stagger-2">
              <SectionHeader
                icon={<PanelLeft size={15}/>}
                title="Sidebar"
                sub={`${visibleCount} de ${items.length} secciones visibles · arrastrá para reordenar`}
                color="#60a5fa"
                actions={
                  <div className="flex items-center gap-2">
                    <button onClick={resetConfig}
                      className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[.03]">
                      Restaurar
                    </button>
                    <Button size="sm" onClick={saveConfig} disabled={savingBar}>
                      {saved ? '✓ Guardado' : savingBar ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                }
              />

              <div className="p-4 space-y-1">
                {items.map((item, idx) => {
                  const isDragging = dragging === idx
                  const isDropZone = dropAt === idx && dragging !== null && dragging !== idx
                  const isConfig   = item.href === '/config'
                  return (
                    <div key={item.href} draggable
                      onDragStart={e => onDragStart(e, idx)} onDragOver={e => onDragOver(e, idx)}
                      onDrop={onDrop} onDragEnd={onDragEnd}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-100 cursor-default select-none"
                      style={isDragging
                        ? { opacity: 0.4, background: 'var(--surface-2)', border: '1px solid var(--border)' }
                        : isDropZone
                          ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 0 14px rgba(255,255,255,0.08)' }
                          : { background: 'var(--surface-0)', border: '1px solid var(--border)' }}
                    >
                      <GripVertical size={14} className="text-[var(--text-4)] shrink-0 cursor-grab active:cursor-grabbing" />
                      <item.Icon size={14} style={{ color: item.visible ? 'var(--text-3)' : 'var(--text-4)' }} />
                      <span className="text-sm font-medium flex-1" style={{ color: item.visible ? 'var(--text-2)' : 'var(--text-4)' }}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-4)] mr-2">{item.group}</span>
                      <button onClick={() => toggleVisible(item.href)} disabled={isConfig}
                        title={isConfig ? 'Siempre visible' : undefined}
                        className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0"
                        style={{
                          background: isConfig || item.visible ? 'var(--amber)' : 'var(--surface-2)',
                          boxShadow: (isConfig || item.visible) ? '0 0 10px rgba(245,158,11,0.4)' : 'none',
                          opacity: isConfig ? 0.4 : 1,
                          cursor: isConfig ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${item.visible ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Equipo ── */}
            <section className="panel-neon overflow-hidden animate-fade-up stagger-3">
              <SectionHeader
                icon={<Users size={15}/>}
                title="Equipo"
                sub={`${team.length} ${team.length === 1 ? 'miembro' : 'miembros'} registrados`}
                color="#a78bfa"
                actions={<Button size="sm" onClick={openAdd}>+ Agregar</Button>}
              />
              <div className="p-4">
                {loadingTeam ? (
                  <p className="text-sm text-[var(--text-3)] px-1 py-2">Cargando...</p>
                ) : team.length === 0 ? (
                  <p className="text-sm text-[var(--text-3)] px-1 py-2">Sin miembros todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {team.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl transition-all"
                        style={ROW}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', boxShadow: '0 0 12px rgba(167,139,250,0.15)' }}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                            <p className="text-xs text-[var(--text-3)] truncate">
                              {m.email}{m.role ? ` · ${m.role}` : ''}
                              {m.whatsapp && <span className="text-emerald-500/60"> · WA: {m.whatsapp}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={m.status} />
                          <button onClick={() => openEdit(m)} title="Editar"
                            className="p-1.5 rounded-lg transition-colors text-[var(--text-3)] hover:text-white hover:bg-white/[.06]">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => toggleStatus(m)} title={m.status === 'active' ? 'Desactivar' : 'Activar'}
                            className="p-1.5 rounded-lg transition-colors text-[var(--text-3)] hover:text-amber-400 hover:bg-amber-400/10">
                            <Power size={13}/>
                          </button>
                          <button onClick={() => deleteMember(m)} title="Eliminar"
                            className="p-1.5 rounded-lg transition-colors text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ════ Columna lateral ════ */}
          <div className="xl:col-span-2 space-y-5">

            {/* ── Apariencia ── */}
            <section className="panel-neon overflow-hidden animate-fade-up stagger-1">
              <SectionHeader icon={<Palette size={15}/>} title="Apariencia" sub="Tema del dashboard" color="#f472b6" />
              <div className="p-4">
                <button onClick={toggleTheme}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface-0)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  <div className="w-10 h-6 rounded-full transition-colors relative"
                    style={{ background: theme === 'light' ? 'var(--amber)' : 'var(--surface-2)', boxShadow: theme === 'light' ? '0 0 12px rgba(245,158,11,0.4)' : 'none' }}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${theme === 'light' ? 'left-5' : 'left-1'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {theme === 'light'
                      ? <Sun size={14} className="text-[var(--amber)]" />
                      : <Moon size={14} className="text-[var(--text-3)]" />}
                    <span className="text-sm font-medium text-[var(--text-2)]">{theme === 'light' ? 'Modo claro' : 'Modo oscuro'}</span>
                  </div>
                </button>
              </div>
            </section>

            {/* ── Integraciones ── */}
            <section className="panel-neon overflow-hidden animate-fade-up stagger-2">
              <SectionHeader
                icon={<Plug size={15}/>}
                title="Integraciones"
                sub={`${INTEGRATIONS.filter(i => i.status === 'connected').length} de ${INTEGRATIONS.length} conectadas`}
                color="#34d399"
              />
              <div className="p-4 space-y-2">
                {INTEGRATIONS.map(i => {
                  const meta = INT_META[i.status]
                  return (
                    <div key={i.name} className="flex items-center justify-between p-3 rounded-xl" style={ROW}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: meta.color, boxShadow: i.status === 'connected' ? `0 0 8px ${meta.color}` : 'none' }} />
                        <span className="text-sm text-[var(--text-2)] truncate">{i.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                        style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}30`, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Credenciales ── */}
            <section className="panel-neon overflow-hidden animate-fade-up stagger-3">
              <SectionHeader
                icon={<KeyRound size={15}/>}
                title="Credenciales"
                sub="API keys en variables de entorno de Vercel — nunca se muestran"
                color="#f87171"
              />
              <div className="p-4 space-y-1.5">
                {[
                  'ANTHROPIC_API_KEY', 'N8N_API_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                  'GMAIL_CLIENT_SECRET', 'INSTAGRAM_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'TIKTOK_ACCESS_TOKEN',
                ].map(key => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={ROW}>
                    <span className="text-xs font-mono text-[var(--text-3)] truncate">{key}</span>
                    <span className="text-xs text-[var(--text-4)] font-mono tracking-widest shrink-0">••••••••</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editMember ? 'Editar miembro' : 'Agregar miembro'}>
        <div className="space-y-4">
          {!editMember && (
            <p className="text-xs text-[var(--text-3)]">
              Para acceso al sistema usá &quot;Invite user&quot; en Supabase Auth. Acá solo registrás el miembro en la tabla del equipo.
            </p>
          )}
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan García" />
          <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="juan@email.com" />
          <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">Usuario</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </Select>
          <Input label="WhatsApp (sin + ni espacios)" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="5491112345678" />
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
