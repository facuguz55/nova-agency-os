'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDateFull } from '@/lib/utils'
import { Star } from 'lucide-react'

interface Project {
  id: string; name: string; status: string; description: string | null
  budget: number | null; created_at: string; featured_until: string | null
  clients: { name: string; email: string | null } | null
}

interface Client { id: string; name: string }

const EMPTY = { name: '', client_id: '', status: 'planning', description: '', budget: '' }

export default function ProjectsPage() {
  usePageTitle('Proyectos')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/projects?${params}`),
      fetch('/api/clients'),
    ])
    const { projects: data } = await pRes.json()
    const { clients: clientData } = await cRes.json()
    setProjects(data || [])
    setClients(clientData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function save() {
    setSaving(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(form.budget) : null }),
    })
    setShowModal(false)
    setForm(EMPTY)
    setSaving(false)
    load()
  }

  async function toggleFeatured(e: React.MouseEvent, p: Project) {
    e.stopPropagation()
    const isFeatured = p.featured_until && new Date(p.featured_until) > new Date()
    const newValue = isFeatured ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await fetch(`/api/projects/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_until: newValue }),
    })
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, featured_until: newValue } : x))
  }

  return (
    <>
      <Header
        title="Proyectos"
        subtitle={`${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => setShowModal(true)}>+ Nuevo proyecto</Button>}
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#ff8c42]"
          >
            <option value="">Todos los estados</option>
            <option value="planning">Planning</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><p className="text-[#475569] text-sm">Cargando...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-[#475569] text-sm">No hay proyectos</p>
                <Button onClick={() => setShowModal(true)} size="sm">Crear primer proyecto</Button>
              </div>
            ) : projects.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="relative bg-[#1e293b] border rounded-xl p-4 cursor-pointer transition-all hover:border-[#ff8c42]/40"
                style={{
                  borderColor: p.featured_until && new Date(p.featured_until) > new Date() ? 'rgba(249,115,22,0.45)' : '#334155',
                  boxShadow: p.featured_until && new Date(p.featured_until) > new Date() ? '0 0 20px rgba(249,115,22,0.08)' : 'none',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white truncate flex-1 pr-2">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                {p.featured_until && new Date(p.featured_until) > new Date() && (
                  <span className="inline-block mb-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                    ⭐ Destacado en portal
                  </span>
                )}
                {/* Cliente — chip visible */}
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {p.clients?.name || 'Sin cliente'}
                  </span>
                </div>
                {p.description && <p className="text-xs text-[#94a3b8] mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-auto">
                  {p.budget ? <span className="text-xs text-[#ff8c42]">${p.budget.toLocaleString()}</span> : <span />}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#475569]">{formatDateFull(p.created_at)}</span>
                    <button
                      onClick={(e) => toggleFeatured(e, p)}
                      title={p.featured_until && new Date(p.featured_until) > new Date() ? 'Quitar destacado' : 'Destacar en portal del cliente'}
                      className="p-1 rounded-lg transition-colors"
                      style={{
                        color: p.featured_until && new Date(p.featured_until) > new Date() ? '#f97316' : '#334155',
                      }}
                    >
                      <Star size={13} fill={p.featured_until && new Date(p.featured_until) > new Date() ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo proyecto">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Proyecto X" />
          <Select label="Cliente *" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planning">Planning</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </Select>
          <Input label="Presupuesto (ARS)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} type="number" placeholder="5000" />
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name || !form.client_id}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
