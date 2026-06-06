'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDateFull } from '@/lib/utils'
import { Star, Trash2, ChevronDown, Plus, FolderOpen, CheckCircle, Clock, Pause, Zap } from 'lucide-react'

interface Project {
  id: string; name: string; status: string; description: string | null
  budget: number | null; created_at: string; featured_until: string | null
  clients: { name: string; email: string | null } | null
}

interface Client { id: string; name: string }

const EMPTY = { name: '', client_id: '', status: 'active', description: '', budget: '' }

const STATUS_CYCLE: Record<string, string> = {
  planning: 'active',
  active: 'completed',
  completed: 'paused',
  paused: 'planning',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  planning:  { label: 'Planning',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: <Clock size={10}/> },
  active:    { label: 'Activo',     color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <Zap size={10}/> },
  completed: { label: 'Completado', color: '#666',    bg: 'rgba(255,255,255,0.06)', icon: <CheckCircle size={10}/> },
  paused:    { label: 'Pausado',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Pause size={10}/> },
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const STAT_FILTERS = [
  { key: 'active',    label: 'Activos',     color: '#10b981' },
  { key: 'planning',  label: 'Planning',    color: '#3b82f6' },
  { key: 'completed', label: 'Completados', color: '#666'    },
  { key: 'paused',    label: 'Pausados',    color: '#f59e0b' },
]

export default function ProjectsPage() {
  usePageTitle('Proyectos')
  const [projects, setProjects] = useState<Project[]>([])
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  async function load() {
    setLoading(true)
    const [pRes, cRes] = await Promise.all([fetch('/api/projects'), fetch('/api/clients')])
    const { projects: data }   = await pRes.json()
    const { clients: clientData } = await cRes.json()
    setProjects(data || [])
    setClients(clientData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!statusFilter) return projects
    return projects.filter(p => p.status === statusFilter)
  }, [projects, statusFilter])

  const byMonth = useMemo(() => {
    const groups: Record<string, Project[]> = {}
    for (const p of filtered) {
      const d     = new Date(p.created_at)
      const key   = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, ps]) => {
        const d     = new Date(ps[0].created_at)
        const label = `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
        return { label, projects: ps }
      })
  }, [filtered])

  async function save() {
    setSaving(true)
    await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget: form.budget ? parseFloat(form.budget) : null }),
    })
    setShowModal(false); setForm(EMPTY); setSaving(false); load()
  }

  async function cycleStatus(e: React.MouseEvent, p: Project) {
    e.stopPropagation()
    const next = STATUS_CYCLE[p.status] || 'active'
    setTogglingId(p.id)
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x))
    await fetch(`/api/projects/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setTogglingId(null)
  }

  async function deleteProject(e: React.MouseEvent, p: Project) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${p.name}"?`)) return
    setDeletingId(p.id)
    setProjects(prev => prev.filter(x => x.id !== p.id))
    await fetch(`/api/projects/${p.id}`, { method: 'DELETE' })
    setDeletingId(null)
  }

  async function toggleFeatured(e: React.MouseEvent, p: Project) {
    e.stopPropagation()
    const isFeatured = p.featured_until && new Date(p.featured_until) > new Date()
    const newValue   = isFeatured ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await fetch(`/api/projects/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_until: newValue }),
    })
    setProjects(prev => prev.map(x => x.id === p.id ? { ...x, featured_until: newValue } : x))
  }

  return (
    <>
      <Header
        title="Proyectos"
        subtitle={`${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => setShowModal(true)}><Plus size={13}/> Nuevo proyecto</Button>}
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* Stats / filtros rápidos */}
        <div className="grid grid-cols-4 gap-3 animate-fade-up">
          {STAT_FILTERS.map((sf, i) => {
            const count = projects.filter(p => p.status === sf.key).length
            const isActive = statusFilter === sf.key
            return (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(f => f === sf.key ? '' : sf.key)}
                className="p-4 rounded-2xl border text-left transition-all animate-fade-up"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  background: isActive ? `${sf.color}12` : 'var(--surface-0)',
                  borderColor: isActive ? `${sf.color}35` : 'var(--border)',
                  boxShadow: isActive ? `0 0 20px ${sf.color}08` : 'none',
                }}
              >
                <p className="text-[24px] font-bold leading-none mb-1"
                  style={{ color: sf.color, fontFamily: 'var(--font-display)' }}>{count}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{sf.label}</p>
              </button>
            )
          })}
        </div>

        {/* Filtros pill */}
        <div className="flex gap-2 flex-wrap animate-fade-up stagger-2">
          {['', 'planning', 'active', 'completed', 'paused'].map(s => {
            const meta = STATUS_META[s]
            const isActive = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  background: isActive ? (s ? `${meta.color}18` : 'rgba(255,255,255,0.08)') : 'var(--surface-1)',
                  borderColor: isActive ? (s ? `${meta.color}40` : 'rgba(255,255,255,0.18)') : 'var(--border)',
                  color: isActive ? (s ? meta.color : 'var(--text)') : 'var(--text-3)',
                }}
              >
                {s === '' ? 'Todos' : meta?.label ?? s}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <FolderOpen size={22} style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              No hay proyectos{statusFilter ? ` con estado "${STATUS_META[statusFilter]?.label}"` : ''}
            </p>
            <Button onClick={() => setShowModal(true)} size="sm">Crear primer proyecto</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {byMonth.map(({ label, projects: ps }) => (
              <div key={label} className="animate-fade-up">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 px-0.5"
                  style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>
                  {label}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {ps.map((p, idx) => {
                    const st = STATUS_META[p.status] ?? STATUS_META.planning
                    const isFeatured = !!(p.featured_until && new Date(p.featured_until) > new Date())
                    return (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="group relative rounded-2xl p-4 cursor-pointer transition-all animate-fade-up"
                        style={{
                          background: 'var(--surface-0)',
                          border: isFeatured
                            ? '1px solid rgba(245,158,11,0.3)'
                            : '1px solid var(--border)',
                          boxShadow: isFeatured ? '0 0 24px rgba(245,158,11,0.06)' : 'none',
                          animationDelay: `${0.2 + idx * 0.05}s`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'
                          if (!isFeatured) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-0)'
                          if (!isFeatured) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                        }}
                      >
                        {/* Amber glow top bar for featured */}
                        {isFeatured && (
                          <div className="absolute top-0 left-4 right-4 h-px"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.5), transparent)' }} />
                        )}

                        {/* Header */}
                        <div className="flex items-start gap-2 mb-3">
                          <h3 className="text-sm font-bold truncate flex-1" style={{ color: 'var(--text)' }}>{p.name}</h3>
                          <button
                            onClick={e => cycleStatus(e, p)}
                            title="Click para cambiar estado"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 transition-opacity"
                            style={{
                              background: st.bg,
                              border: `1px solid ${st.color}30`,
                              color: st.color,
                              opacity: togglingId === p.id ? 0.5 : 1,
                            }}
                          >
                            {st.icon}
                            {st.label}
                            <ChevronDown size={9}/>
                          </button>
                        </div>

                        {/* Cliente */}
                        <div className="mb-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa' }}>
                            {p.clients?.name || 'Sin cliente'}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-2)' }}>{p.description}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2 pt-2.5"
                          style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-1.5">
                            {p.budget && (
                              <span className="text-xs font-bold" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                                ${p.budget.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>{formatDateFull(p.created_at)}</span>
                            <button
                              onClick={e => toggleFeatured(e, p)}
                              title={isFeatured ? 'Quitar destacado' : 'Destacar'}
                              className="p-1 rounded-lg transition-colors ml-1"
                              style={{ color: isFeatured ? 'var(--amber)' : 'var(--text-4)' }}
                            >
                              <Star size={12} fill={isFeatured ? 'currentColor' : 'none'}/>
                            </button>
                            <button
                              onClick={e => deleteProject(e, p)}
                              className="p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Eliminar"
                              style={{ color: 'var(--text-3)', opacity: deletingId === p.id ? 1 : undefined }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                            >
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
          <Select label="Estado inicial" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planning">Planning</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </Select>
          <Input label="Presupuesto (ARS)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} type="number" placeholder="500000" />
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name || !form.client_id}>
              {saving ? 'Guardando...' : 'Crear proyecto'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
