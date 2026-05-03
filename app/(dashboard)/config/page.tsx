'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { ALL_NAV_GROUPS, getSidebarHidden, setSidebarHidden } from '@/lib/sidebar-config'

interface TeamMember {
  id: string; name: string; email: string; role: string; status: string; created_at: string
}

interface Integration {
  name: string; key: string; status: 'connected' | 'disconnected' | 'not_configured'
}

const integrationStatus = {
  connected:     { label: 'Conectado',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  disconnected:  { label: 'Desconectado',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  not_configured:{ label: 'Sin configurar',cls: 'bg-[#1a2d45] text-[#4a6080] border-[#1a2d45]' },
}

const INTEGRATIONS: Integration[] = [
  { name: 'Supabase',          key: 'supabase',   status: 'connected' },
  { name: 'Claude AI (Haiku)', key: 'claude',     status: 'connected' },
  { name: 'n8n',               key: 'n8n',        status: 'connected' },
  { name: 'Gmail API',         key: 'gmail',      status: 'disconnected' },
  { name: 'Instagram API',     key: 'instagram',  status: 'not_configured' },
  { name: 'YouTube API',       key: 'youtube',    status: 'not_configured' },
  { name: 'TikTok API',        key: 'tiktok',     status: 'not_configured' },
]

export default function ConfigPage() {
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ name: '', email: '', role: 'user', password: '' })
  const [saving, setSaving]       = useState(false)
  const [hiddenItems, setHiddenItems] = useState<string[]>([])

  useEffect(() => {
    loadTeam()
    setHiddenItems(getSidebarHidden())
  }, [])

  async function loadTeam() {
    setLoadingTeam(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setTeam(data || [])
    setLoadingTeam(false)
  }

  async function addMember() {
    setSaving(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('team_members').insert({
      name: form.name,
      email: form.email,
      role: form.role as 'owner' | 'manager' | 'user',
    })
    setShowModal(false)
    setForm({ name: '', email: '', role: 'user', password: '' })
    setSaving(false)
    loadTeam()
  }

  async function toggleStatus(member: TeamMember) {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('team_members')
      .update({ status: member.status === 'active' ? 'inactive' : 'active' })
      .eq('id', member.id)
    loadTeam()
  }

  function toggleSidebarItem(href: string) {
    const next = hiddenItems.includes(href)
      ? hiddenItems.filter(h => h !== href)
      : [...hiddenItems, href]
    setHiddenItems(next)
    setSidebarHidden(next)
  }

  function resetSidebar() {
    setHiddenItems([])
    setSidebarHidden([])
  }

  return (
    <>
      <Header title="Configuración" subtitle="Equipo, sidebar, integraciones y credenciales" />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Sidebar</h3>
              <p className="text-xs text-[#4a6080] mt-0.5">Activá o desactivá las páginas que aparecen en el menú lateral.</p>
            </div>
            <button
              onClick={resetSidebar}
              className="text-xs text-[#4a6080] hover:text-[#94a3b8] transition-colors"
            >
              Restaurar todo
            </button>
          </div>

          <div className="space-y-4">
            {ALL_NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#253f60] mb-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map(({ href, label, Icon }) => {
                    const visible = !hiddenItems.includes(href)
                    const isConfig = href === '/config'
                    return (
                      <div
                        key={href}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#080f1e] border border-[#1a2d45]"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className={visible ? 'text-[#64748b]' : 'text-[#253f60]'} />
                          <span className={`text-sm font-medium ${visible ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
                            {label}
                          </span>
                        </div>
                        <button
                          onClick={() => !isConfig && toggleSidebarItem(href)}
                          disabled={isConfig}
                          title={isConfig ? 'Esta página siempre es visible' : undefined}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                            isConfig
                              ? 'opacity-40 cursor-not-allowed bg-[#f97316]'
                              : visible
                                ? 'bg-[#f97316] cursor-pointer'
                                : 'bg-[#1a2d45] cursor-pointer'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                              visible ? 'left-[18px]' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Equipo ────────────────────────────────────────────── */}
        <section className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Equipo</h3>
            <Button size="sm" onClick={() => setShowModal(true)}>+ Agregar</Button>
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
                      <p className="text-xs text-[#4a6080]">{m.email} · {m.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <button
                      onClick={() => toggleStatus(m)}
                      className="text-xs px-2.5 py-1 bg-[#1a2d45] hover:bg-[#253f60] text-[#94a3b8] hover:text-white rounded-lg transition-colors"
                    >
                      {m.status === 'active' ? 'Desactivar' : 'Activar'}
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
            {INTEGRATIONS.map(i => {
              const s = integrationStatus[i.status]
              return (
                <div key={i.key} className="flex items-center justify-between p-3 bg-[#080f1e] border border-[#1a2d45] rounded-lg">
                  <span className="text-sm text-[#94a3b8]">{i.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar miembro del equipo">
        <div className="space-y-4">
          <p className="text-xs text-[#4a6080]">
            Para crear el usuario en Supabase Auth usá "Invite user" desde el dashboard → Authentication. Acá solo registrás el miembro en la tabla del equipo.
          </p>
          <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan García" />
          <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="juan@email.com" />
          <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">Usuario</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </Select>
          <div className="flex gap-2 pt-1">
            <Button onClick={addMember} disabled={saving || !form.name || !form.email}>
              {saving ? 'Guardando...' : 'Agregar'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
