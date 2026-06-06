'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'

interface Automation {
  id: string; name: string; description: string | null; status: string
  trigger_type: string; notes: string | null; created_at: string
  clients: { name: string } | null
}
interface Client { id: string; name: string }

const EMPTY = { name: '', description: '', status: 'active', trigger_type: 'manual', client_id: '', notes: '' }

const PANEL = { background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12 }

export default function AutomationsPage() {
  usePageTitle('Automatizaciones')
  const [automations, setAutomations] = useState<Automation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [aRes, cRes] = await Promise.all([
      fetch(`/api/automations?${params}`),
      fetch('/api/clients'),
    ])
    const { automations: data } = await aRes.json()
    const { clients: cData } = await cRes.json()
    setAutomations(data || [])
    setClients(cData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function save() {
    setSaving(true)
    await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, client_id: form.client_id || null }),
    })
    setShowModal(false)
    setForm(EMPTY)
    setSaving(false)
    load()
  }

  async function toggleStatus(a: Automation) {
    await fetch(`/api/automations/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: a.status === 'active' ? 'inactive' : 'active' }),
    })
    load()
  }

  async function deleteAutomation(a: Automation) {
    if (!confirm(`¿Eliminar "${a.name}"?`)) return
    await fetch(`/api/automations/${a.id}`, { method: 'DELETE' })
    load()
  }

  const TRIGGER_ICONS = { email: '✉', webhook: '⚡', schedule: '⏱', manual: '▶' }

  return (
    <>
      <Header
        title="Automatizaciones"
        subtitle={`${automations.filter(a => a.status === 'active').length} activas`}
        actions={<Button onClick={() => setShowModal(true)}>+ Nueva automatización</Button>}
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-white text-sm focus:outline-none transition-all"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <option value="">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[var(--text-3)] text-sm">No hay automatizaciones</p>
            <Button onClick={() => setShowModal(true)} size="sm">Crear primera automatización</Button>
          </div>
        ) : (
          <div style={PANEL} className="overflow-hidden animate-fade-up">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Trigger', 'Cliente', 'Estado', 'Creada', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-[var(--text-4)] uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {automations.map(a => (
                  <tr
                    key={a.id}
                    className="hover:bg-white/[.02] transition-colors last:border-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      {a.description && <p className="text-xs text-[var(--text-3)] mt-0.5 truncate max-w-xs">{a.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--text-2)]">
                        <span>{TRIGGER_ICONS[a.trigger_type as keyof typeof TRIGGER_ICONS]}</span>
                        {a.trigger_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-2)]">{a.clients?.name || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--text-3)]">{formatRelative(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(a)}
                          className="text-xs px-2 py-1 text-white rounded-lg transition-colors hover:bg-white/[.07]"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          {a.status === 'active' ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteAutomation(a)}
                          className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva automatización">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Select label="Trigger *" value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}>
            <option value="manual">Manual</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
            <option value="schedule">Schedule</option>
          </Select>
          <Select label="Cliente" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Sin cliente asociado</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </Select>
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Textarea label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
