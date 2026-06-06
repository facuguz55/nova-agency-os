'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDateFull } from '@/lib/utils'
import { Star, Trash2, ChevronDown, Plus, FolderOpen } from 'lucide-react'

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

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  planning:  { label: 'Planning',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  active:    { label: 'Activo',     bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: 'bg-emerald-400' },
  completed: { label: 'Completado', bg: 'bg-[#1e2f4a]',     text: 'text-[#64748b]',  dot: 'bg-[#475569]' },
  paused:    { label: 'Pausado',    bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-400' },
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

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

  // Agrupar por mes (created_at)
  const byMonth = useMemo(() => {
    const groups: Record<string, Project[]> = {}
    for (const p of filtered) {
      const d     = new Date(p.created_at)
      const key   = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      const label = `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
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

  const activeCount    = projects.filter(p => p.status === 'active').length
  const completedCount = projects.filter(p => p.status === 'completed').length
  const planningCount  = projects.filter(p => p.status === 'planning').length

  return (
    <>
      <Header
        title="Proyectos"
        subtitle={`${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => setShowModal(true)}><Plus size={13}/> Nuevo proyecto</Button>}
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-grid">
        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Activos',     count: activeCount,    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
            { label: 'Planning',    count: planningCount,  color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
            { label: 'Completados', count: completedCount, color: 'text-[#64748b]',   bg: 'bg-[#0e1a2e] border-[#1e2f4a]' },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(f => f === s.label.toLowerCase().replace('planning','planning').replace('activos','active').replace('completados','completed') ? '' : ({activos:'active',planning:'planning',completados:'completed'}[s.label.toLowerCase() as string] ?? ''))}
              className={`p-4 rounded-2xl border text-left transition-colors ${s.bg}`}
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-[#475569] mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {['', 'planning', 'active', 'completed', 'paused'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? 'bg-[#ff8c42]/15 border-[#ff8c42]/40 text-[#ff8c42]'
                  : 'bg-[#0e1a2e] border-[#1e2f4a] text-[#475569] hover:text-white'
              }`}
            >
              {s === '' ? 'Todos' : STATUS_STYLE[s]?.label ?? s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
              <FolderOpen size={24} className="text-[#1e2f4a]"/>
            </div>
            <p className="text-sm text-[#475569]">No hay proyectos{statusFilter ? ` con estado "${STATUS_STYLE[statusFilter]?.label}"` : ''}</p>
            <Button onClick={() => setShowModal(true)} size="sm">Crear primer proyecto</Button>
          </div>
        ) : (
          /* Agrupado por mes */
          <div className="space-y-6">
            {byMonth.map(({ label, projects: ps }) => (
              <div key={label}>
                <p className="text-[11px] font-bold text-[#253f60] uppercase tracking-widest mb-3">{label}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {ps.map(p => {
                    const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.planning
                    const isFeatured = !!(p.featured_until && new Date(p.featured_until) > new Date())
                    return (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="group relative bg-[#0e1a2e] border border-[#1e2f4a] hover:border-[#253f60] rounded-2xl p-4 cursor-pointer transition-all"
                        style={isFeatured ? { borderColor: 'rgba(249,115,22,0.4)', boxShadow: '0 0 20px rgba(249,115,22,0.06)' } : {}}
                      >
                        {/* Header */}
                        <div className="flex items-start gap-2 mb-3">
                          <h3 className="text-sm font-bold text-white truncate flex-1">{p.name}</h3>
                          {/* Toggle status — click sin entrar al proyecto */}
                          <button
                            onClick={e => cycleStatus(e, p)}
                            title="Click para cambiar estado"
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border shrink-0 transition-colors hover:opacity-80 ${st.bg} ${st.text} border-current/20`}
                            style={{ opacity: togglingId === p.id ? 0.5 : 1 }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`}/>
                            {st.label}
                            <ChevronDown size={9} className="shrink-0"/>
                          </button>
                        </div>

                        {/* Cliente */}
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {p.clients?.name || 'Sin cliente'}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-[#475569] mb-3 line-clamp-2">{p.description}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2f4a]">
                          <div className="flex items-center gap-1.5">
                            {p.budget && (
                              <span className="text-xs font-bold text-[#ff8c42]">${p.budget.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#334155]">{formatDateFull(p.created_at)}</span>
                            <button
                              onClick={e => toggleFeatured(e, p)}
                              title={isFeatured ? 'Quitar destacado' : 'Destacar en portal'}
                              className="p-1 rounded-lg transition-colors ml-1"
                              style={{ color: isFeatured ? '#f97316' : '#334155' }}
                            >
                              <Star size={12} fill={isFeatured ? 'currentColor' : 'none'}/>
                            </button>
                            <button
                              onClick={e => deleteProject(e, p)}
                              className="p-1 rounded-lg text-[#253f60] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Eliminar proyecto"
                              style={{ opacity: deletingId === p.id ? 1 : undefined }}
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
