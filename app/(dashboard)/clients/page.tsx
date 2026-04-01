'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'

interface Client {
  id: string; name: string; email: string | null; industry: string | null
  status: string; contact_person: string | null; notes: string | null
  created_at: string
}

const EMPTY = { name: '', email: '', industry: '', status: 'active', contact_person: '', notes: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/clients?${params}`)
    const { clients: data } = await res.json()
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function save() {
    setSaving(true)
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowModal(false)
    setForm(EMPTY)
    setSaving(false)
    load()
  }

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowModal(true)}>+ Nuevo cliente</Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filtros */}
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="flex-1 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#ff8c42]"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#ff8c42]"
          >
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="prospect">Prospecto</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><p className="text-[#475569] text-sm">Cargando...</p></div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[#475569] text-sm">No hay clientes</p>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar primer cliente</Button>
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  {['Nombre', 'Email', 'Industria', 'Contacto', 'Estado', 'Creado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#475569] uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="border-b border-[#334155]/50 hover:bg-[#334155]/30 cursor-pointer transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-[#94a3b8]">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#94a3b8]">{c.industry || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#94a3b8]">{c.contact_person || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-[#475569]">{formatRelative(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo cliente */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo cliente">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Empresa SA" />
          <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" type="email" />
          <Input label="Industria" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="E-commerce, Salud, etc." />
          <Input label="Persona de contacto" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Juan García" />
          <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="prospect">Prospecto</option>
          </Select>
          <Textarea label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Información adicional..." rows={3} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
