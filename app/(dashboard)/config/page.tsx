'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface TeamMember {
  id: string; name: string; email: string; role: string; status: string; created_at: string
}

interface Integration {
  name: string; key: string; status: 'connected' | 'disconnected' | 'not_configured'
}

export default function ConfigPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: '' })
  const [saving, setSaving] = useState(false)

  const integrations: Integration[] = [
    { name: 'Supabase', key: 'supabase', status: 'connected' },
    { name: 'Claude AI (Haiku)', key: 'claude', status: 'connected' },
    { name: 'n8n', key: 'n8n', status: 'connected' },
    { name: 'Gmail API', key: 'gmail', status: 'disconnected' },
    { name: 'Instagram API', key: 'instagram', status: 'not_configured' },
    { name: 'YouTube API', key: 'youtube', status: 'not_configured' },
    { name: 'TikTok API', key: 'tiktok', status: 'not_configured' },
  ]

  async function loadTeam() {
    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setTeam(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTeam() }, [])

  async function addMember() {
    setSaving(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // Crear usuario en Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin?.createUser?.({
      email: form.email,
      password: form.password,
      email_confirm: true,
    }) ?? { data: null, error: new Error('Admin no disponible desde el cliente') }

    // Crear en tabla team_members igual
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

  const integrationStatus = {
    connected: { label: 'Conectado', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
    disconnected: { label: 'Desconectado', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
    not_configured: { label: 'Sin configurar', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  }

  return (
    <>
      <Header title="Configuración" subtitle="Equipo, integraciones y credenciales" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Equipo */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Equipo</h3>
            <Button size="sm" onClick={() => setShowModal(true)}>+ Agregar miembro</Button>
          </div>

          {loading ? (
            <p className="text-sm text-[#475569]">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {team.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-[#0f172a]/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ff8c42]/10 border border-[#ff8c42]/20 flex items-center justify-center text-sm font-bold text-[#ff8c42]">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-[#475569]">{m.email} · {m.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <button
                      onClick={() => toggleStatus(m)}
                      className="text-xs px-2 py-1 bg-[#334155] hover:bg-[#475569] text-white rounded-lg transition-colors"
                    >
                      {m.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integraciones */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Integraciones</h3>
          <div className="space-y-2">
            {integrations.map(i => (
              <div key={i.key} className="flex items-center justify-between p-3 bg-[#0f172a]/60 rounded-lg">
                <span className="text-sm text-white">{i.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${integrationStatus[i.status].class}`}>
                  {integrationStatus[i.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vault */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Vault de credenciales</h3>
          <p className="text-xs text-[#475569] mb-4">Las API keys están almacenadas como variables de entorno en Vercel. Los valores nunca se muestran.</p>
          <div className="space-y-2">
            {['ANTHROPIC_API_KEY', 'N8N_API_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'GMAIL_CLIENT_SECRET', 'INSTAGRAM_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'TIKTOK_ACCESS_TOKEN'].map(key => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#0f172a]/60 rounded-lg">
                <span className="text-xs font-mono text-[#94a3b8]">{key}</span>
                <span className="text-xs text-[#334155] font-mono">••••••••••••</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar miembro del equipo">
        <div className="space-y-4">
          <p className="text-xs text-[#475569]">
            Nota: Para crear el usuario en Supabase Auth hacé clic en "Invite user" desde el dashboard de Supabase → Authentication. Acá solo registrás el miembro en la tabla del equipo.
          </p>
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan García" />
          <Input label="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="juan@gmail.com" />
          <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="user">Usuario</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={addMember} disabled={saving || !form.name || !form.email}>{saving ? 'Guardando...' : 'Agregar'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
