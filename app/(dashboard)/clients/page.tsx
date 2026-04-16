'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { UserPlus, Search, ChevronRight } from 'lucide-react'

interface Client {
  id: string; name: string; email: string | null; industry: string | null
  status: string; contact_person: string | null; notes: string | null; created_at: string
}

const EMPTY = { name: '', email: '', industry: '', status: 'active', contact_person: '', notes: '' }

export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (search) p.set('search', search)
    const res = await fetch(`/api/clients?${p}`)
    const { clients: data } = await res.json()
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function save() {
    setSaving(true)
    await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false); setForm(EMPTY); setSaving(false); load()
  }

  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${activeCount} activos · ${clients.length} total`}
        actions={<Button onClick={() => setShowModal(true)}><UserPlus size={14}/> Nuevo cliente</Button>}
      />

      <div className="flex-1 p-6 space-y-4 bg-grid overflow-y-auto">
        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#334155]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-white placeholder-[#334155] text-sm focus:outline-none focus:border-[#ff8c42]/40 transition-all"
            />
          </div>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40 transition-all"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="prospect">Prospectos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
              <UserPlus size={20} className="text-[#334155]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[#475569]">No hay clientes</p>
              <p className="text-xs text-[#334155] mt-1">Agregá tu primer cliente para empezar</p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar cliente</Button>
          </div>
        ) : (
          <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            {/* Top line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e2f4a] to-transparent" />
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2f4a]">
                  {['Nombre', 'Email', 'Industria', 'Contacto', 'Estado', 'Hace'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] text-[#334155] uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                  <th className="w-8"/>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="border-b border-[#1e2f4a]/50 hover:bg-white/[.02] cursor-pointer transition-colors group last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ff8c42]/10 border border-[#ff8c42]/20 flex items-center justify-center text-sm font-bold text-[#ff8c42] shrink-0 group-hover:shadow-[0_0_10px_rgba(255,140,66,.2)] transition-all">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.email || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.industry || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.contact_person || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.status}/></td>
                    <td className="px-5 py-4 text-xs text-[#334155]">{formatRelative(c.created_at)}</td>
                    <td className="px-3"><ChevronRight size={14} className="text-[#1e2f4a] group-hover:text-[#ff8c42] transition-colors"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo cliente">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Empresa SA" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" type="email" />
            <Input label="Industria" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="E-commerce" />
          </div>
          <Input label="Persona de contacto" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Juan García" />
          <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="prospect">Prospecto</option>
          </Select>
          <Textarea label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Información adicional..." rows={3} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Guardando...' : 'Crear cliente'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
