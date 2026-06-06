'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Server {
  id: string; name: string; host: string; port: number
  status: string; last_check: string | null; created_at: string
}

const CARD = { background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12 }

export default function ServersPage() {
  usePageTitle('Servidores')
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', host: '', port: '22' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/servers')
    const { servers: data } = await res.json()
    setServers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, port: parseInt(form.port) }),
    })
    setShowModal(false)
    setForm({ name: '', host: '', port: '22' })
    setSaving(false)
    load()
  }

  async function ping(server: Server) {
    await fetch('/api/servers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: server.id, last_check: new Date().toISOString() }),
    })
    load()
  }

  return (
    <>
      <Header
        title="Servidores"
        subtitle="Estado e infraestructura"
        actions={<Button onClick={() => setShowModal(true)}>+ Agregar servidor</Button>}
      />

      <div className="flex-1 p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[var(--text-3)] text-sm">No hay servidores registrados</p>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar servidor</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {servers.map((s, i) => (
              <div key={s.id} className="animate-fade-up" style={{ ...CARD, padding: '20px', animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                    <p className="text-xs text-[var(--text-3)] mt-0.5 font-mono">{s.host}:{s.port}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-[var(--text-4)]">
                    {s.last_check ? `Último check: ${formatDate(s.last_check)}` : 'Sin verificar'}
                  </span>
                  <button
                    onClick={() => ping(s)}
                    className="text-xs px-2 py-1 text-white rounded-lg transition-colors hover:bg-white/[.07]"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    Ping
                  </button>
                </div>

                <div className="mt-3 p-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs text-[var(--text-3)] flex items-center gap-1.5">
                    <span className="text-orange-400">⚠</span>
                    SSH requiere aprobación HIGH — próximamente
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar servidor">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VPS Principal" />
          <Input label="Host *" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder="192.168.1.1 o dominio.com" />
          <Input label="Puerto SSH" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} type="number" placeholder="22" />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name || !form.host}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
