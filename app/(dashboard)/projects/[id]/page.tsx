'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { FolderKanban, Plus, ChevronRight, TrendingUp, Globe, Copy, Check, Pencil } from 'lucide-react'

interface Project {
  id: string; name: string; status: string; description: string | null
  budget: number | null; created_at: string; updated_at: string
  client_id: string | null
  clients: { name: string; email: string | null; contact_person: string | null } | null
}

interface Subproject {
  id: string; name: string; status: string; description: string | null; budget: number | null; created_at: string; add_to_budget: boolean
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Activo',       color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  completed: { label: 'Completado',   color: '#616161', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.08)' },
  paused:    { label: 'Pausado',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  planning:  { label: 'Planificando', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
}

const SUB_EMPTY = { name: '', status: 'planning', description: '', budget: '', add_to_budget: true }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData]           = useState<{ project: Project } | null>(null)
  const [subs, setSubs]           = useState<Subproject[]>([])
  const [editing, setEditing]     = useState(false)
  const [form, setForm]           = useState<Partial<Project>>({})
  const [saving, setSaving]       = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [subForm, setSubForm]     = useState<typeof SUB_EMPTY>(SUB_EMPTY)
  const [savingSub, setSavingSub] = useState(false)
  const [editingSub, setEditingSub] = useState<Subproject | null>(null)
  const [editSubForm, setEditSubForm] = useState<typeof SUB_EMPTY>(SUB_EMPTY)
  const [savingEditSub, setSavingEditSub] = useState(false)
  const [portal, setPortal]       = useState<{ token: string; pin: string; active: boolean } | null | undefined>(undefined)
  const [copiedPortal, setCopiedPortal] = useState(false)

  async function load() {
    const res = await fetch(`/api/projects/${id}`)
    const json = await res.json()
    setData(json)
    setForm(json.project)
  }

  async function loadSubs() {
    const res = await fetch(`/api/projects?parent_id=${id}`)
    const json = await res.json()
    setSubs(json.projects || [])
  }

  useEffect(() => { load(); loadSubs() }, [id])

  useEffect(() => {
    if (!data?.project.client_id) return
    fetch(`/api/clients/${data.project.client_id}/portal`)
      .then(r => r.json())
      .then(j => setPortal(j.portal ?? null))
      .catch(() => setPortal(null))
  }, [data?.project.client_id])

  async function save() {
    setSaving(true)
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        form.name,
        status:      form.status,
        budget:      form.budget ?? null,
        description: form.description ?? null,
      }),
    })
    setSaving(false); setEditing(false); load()
  }

  async function deleteProject() {
    if (!confirm('¿Eliminar este proyecto? También se eliminarán sus subproyectos.')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  async function saveSubproject() {
    if (!subForm.name.trim()) return
    setSavingSub(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          subForm.name.trim(),
        status:        subForm.status,
        description:   subForm.description || null,
        budget:        subForm.budget ? parseFloat(subForm.budget) : null,
        add_to_budget: subForm.add_to_budget,
        parent_id:     id,
        client_id:     data?.project.client_id ?? null,
      }),
    })
    setSavingSub(false)
    if (!res.ok) { alert('Error al crear el subproyecto.'); return }
    setSubForm(SUB_EMPTY); setShowSubModal(false); loadSubs()
  }

  async function deleteSubproject(subId: string) {
    if (!confirm('¿Eliminar este subproyecto?')) return
    await fetch(`/api/projects/${subId}`, { method: 'DELETE' })
    loadSubs()
  }

  function openEditSub(s: Subproject) {
    setEditingSub(s)
    setEditSubForm({
      name:          s.name,
      status:        s.status,
      description:   s.description || '',
      budget:        s.budget ? String(s.budget) : '',
      add_to_budget: s.add_to_budget,
    })
  }

  async function saveEditSubproject() {
    if (!editingSub) return
    setSavingEditSub(true)
    await fetch(`/api/projects/${editingSub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          editSubForm.name,
        status:        editSubForm.status,
        description:   editSubForm.description || null,
        budget:        editSubForm.budget ? parseFloat(editSubForm.budget) : null,
        add_to_budget: editSubForm.add_to_budget,
      }),
    })
    setSavingEditSub(false); setEditingSub(null); loadSubs()
  }

  if (!data) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }} />
    </div>
  )

  const { project } = data
  const st = STATUS_META[project.status] ?? STATUS_META.planning

  const subsBudget  = subs.reduce((acc, s) => acc + (s.add_to_budget ? (Number(s.budget) || 0) : 0), 0)
  const baseBudget  = Number(project.budget) || 0
  const totalBudget = baseBudget + subsBudget

  return (
    <>
      <Header
        title={project.name}
        subtitle={`Cliente: ${project.clients?.name || '—'}`}
        actions={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={save} disabled={saving} size="sm">{saving ? 'Guardando...' : 'Guardar'}</Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setForm(project) }} size="sm">Cancelar</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)} size="sm">Editar</Button>
                <Button variant="danger" onClick={deleteProject} size="sm">Eliminar</Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* ── HERO ── */}
        {(() => {
          const completedSubs = subs.filter(s => s.status === 'completed').length
          const progressPct   = subs.length > 0
            ? Math.round((completedSubs / subs.length) * 100)
            : project.status === 'completed' ? 100 : 0
          const r = 15.9
          return (
            <div className="panel-neon p-6 animate-fade-up relative overflow-hidden">
              <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${st.color}12, transparent 70%)` }} />
              <div className="flex flex-col md:flex-row md:items-center gap-6 relative">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-[24px] font-black"
                    style={{ background: `${st.color}14`, border: `1.5px solid ${st.color}40`, color: st.color, boxShadow: `0 0 20px ${st.color}25`, fontFamily: 'var(--font-display)' }}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-[22px] font-bold neon-text leading-none truncate" style={{ fontFamily: 'var(--font-display)' }}>{project.name}</h2>
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shrink-0"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-3)' }}>
                      {project.clients?.name || 'Sin cliente'} · creado {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Presupuesto total</p>
                    <p className="text-[24px] font-bold neon-amber leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      ${totalBudget.toLocaleString('es-AR')}
                    </p>
                    {subsBudget > 0 && (
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>base ${baseBudget.toLocaleString('es-AR')} + etapas ${subsBudget.toLocaleString('es-AR')}</p>
                    )}
                  </div>
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
                      <circle cx="18" cy="18" r={r} fill="none" stroke={st.color} strokeWidth="3.5"
                        strokeDasharray={`${progressPct} 100`} strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 5px ${st.color}90)` }}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[15px] font-800 text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>{progressPct}%</span>
                      <span className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {subs.length > 0 ? `${completedSubs}/${subs.length} etapas` : 'avance'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info del proyecto */}
          <div className="lg:col-span-2 panel-neon p-5 animate-fade-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Información</h3>
              {!editing && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
                  style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                  {st.label}
                </span>
              )}
            </div>
            {editing ? (
              <div className="space-y-4">
                <Input label="Nombre" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select label="Estado" value={form.status || 'planning'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="planning">Planning</option>
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="paused">Pausado</option>
                </Select>
                <Input label="Presupuesto (ARS)" value={form.budget?.toString() || ''} onChange={e => setForm(f => ({ ...f, budget: parseFloat(e.target.value) || null }))} type="number" />
                <Textarea label="Descripción" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Estado</dt>
                  <dd><StatusBadge status={project.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Presupuesto base</dt>
                  <dd className="text-sm font-semibold" style={{ color: baseBudget ? 'var(--amber)' : 'var(--text-3)' }}>
                    {baseBudget ? `$${baseBudget.toLocaleString('es-AR')}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Creado</dt>
                  <dd className="text-sm text-white">{formatDate(project.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Actualizado</dt>
                  <dd className="text-sm text-white">{formatDate(project.updated_at)}</dd>
                </div>
                {project.description && (
                  <div className="col-span-2">
                    <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Descripción</dt>
                    <dd className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{project.description}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Cliente + Portal */}
          <div className="panel-neon p-5 space-y-4 animate-fade-up stagger-3">
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Cliente</h3>
            {project.clients ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Nombre</dt>
                  <dd className="text-sm font-semibold text-white">{project.clients.name}</dd>
                </div>
                {project.clients.email && (
                  <div>
                    <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Email</dt>
                    <dd className="text-sm" style={{ color: 'var(--text-2)' }}>{project.clients.email}</dd>
                  </div>
                )}
                {project.clients.contact_person && (
                  <div>
                    <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Contacto</dt>
                    <dd className="text-sm" style={{ color: 'var(--text-2)' }}>{project.clients.contact_person}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin cliente asociado</p>
            )}

            {/* Portal del cliente */}
            {portal && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Globe size={11} style={{ color: '#f97316' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Portal</span>
                  <a href={`/portal/${portal.token}`} target="_blank" rel="noreferrer"
                    className="ml-auto text-[10px] transition-colors"
                    style={{ color: '#f97316' }}>
                    Abrir →
                  </a>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                  <span className="text-[11px] truncate flex-1" style={{ color: 'var(--text-3)' }}>
                    /portal/{portal.token.slice(0, 12)}…
                  </span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/portal/${portal.token}`)
                    setCopiedPortal(true); setTimeout(() => setCopiedPortal(false), 2000)
                  }} className="shrink-0 transition-colors" style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}>
                    {copiedPortal ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                  PIN: <span className="text-white font-mono font-bold tracking-widest">{portal.pin}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${portal.active ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {portal.active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/portal/${portal.token}/instalar`)
                    setCopiedPortal(true); setTimeout(() => setCopiedPortal(false), 2000)
                  }}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-[.98]"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
                  {copiedPortal ? '✓ Link copiado' : '↗ Copiar link para cliente'}
                </button>
              </div>
            )}
            {portal === null && project.client_id && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Link href={`/clients/${project.client_id}`}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: 'rgba(249,115,22,0.6)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f97316'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(249,115,22,0.6)'}>
                  <Globe size={11} /> Crear portal en el cliente →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Subproyectos */}
        <div className="panel-neon overflow-hidden animate-fade-up stagger-4">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <FolderKanban size={13} style={{ color: '#f97316' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Subproyectos
                {subs.length > 0 && <span className="ml-2 font-normal normal-case" style={{ color: 'var(--text-4)' }}>({subs.length})</span>}
              </h3>
            </div>
            <button
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
              style={{ color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.5)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.12)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.3)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'
              }}
            >
              <Plus size={11} /> Nuevo subproyecto
            </button>
          </div>

          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <FolderKanban size={16} style={{ color: 'var(--text-4)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Sin subproyectos todavía</p>
              <button onClick={() => setShowSubModal(true)}
                className="text-xs transition-colors"
                style={{ color: '#f97316' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                Crear el primero →
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {subs.map((s, idx) => {
                  const sst = STATUS_META[s.status] ?? STATUS_META.planning
                  return (
                    <div key={s.id}
                      className="rounded-xl p-4 pl-5 group transition-all animate-fade-up relative overflow-hidden"
                      style={{
                        background: 'var(--surface-0)',
                        border: '1px solid var(--border)',
                        animationDelay: `${0.1 + idx * 0.05}s`,
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${sst.color}45`; el.style.boxShadow = `0 0 16px ${sst.color}12` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none' }}>
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                        style={{ background: sst.color, boxShadow: `0 0 6px ${sst.color}80` }} />
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                          style={{ color: 'rgba(249,115,22,0.7)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
                          ↳ Subproyecto
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ color: sst.color, background: sst.bg, borderColor: sst.border }}>
                          {sst.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1 leading-snug">{s.name}</p>
                      {s.description && (
                        <p className="text-[11px] line-clamp-2 mb-3" style={{ color: 'var(--text-3)' }}>{s.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2">
                          {s.budget ? (
                            <span className="text-sm font-bold" style={{ color: 'var(--amber)' }}>
                              ${Number(s.budget).toLocaleString('es-AR')}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-4)' }}>Sin precio</span>
                          )}
                          {s.budget && (
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              s.add_to_budget
                                ? 'text-emerald-400 bg-emerald-400/8 border-emerald-400/20'
                                : 'border-transparent'
                            }`}
                              style={!s.add_to_budget ? { color: 'var(--text-4)', background: 'var(--surface-2)' } : {}}>
                              {s.add_to_budget ? '✓ suma al total' : 'no suma'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditSub(s)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-3)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.background = '' }}
                            title="Editar">
                            <Pencil size={12} />
                          </button>
                          <Link href={`/projects/${s.id}`}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-3)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.background = '' }}
                            title="Ver detalle">
                            <ChevronRight size={13} />
                          </Link>
                          <button onClick={() => deleteSubproject(s.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-3)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.05)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.background = '' }}
                            title="Eliminar">
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumen presupuesto */}
              {(baseBudget > 0 || subsBudget > 0) && (
                <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-0)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={12} style={{ color: '#f97316' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                      Resumen presupuesto
                    </span>
                  </div>

                  {/* Barra apilada: base + cada etapa */}
                  {totalBudget > 0 && (
                    <div className="mb-4">
                      <div className="h-2.5 rounded-full overflow-hidden flex gap-px" style={{ background: 'var(--surface-2)' }}>
                        {baseBudget > 0 && (
                          <div className="h-full" title={`Base $${baseBudget.toLocaleString('es-AR')}`}
                            style={{ width: `${(baseBudget / totalBudget) * 100}%`, background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.6)' }}/>
                        )}
                        {subs.filter(s => s.budget && s.add_to_budget).map((s, i) => (
                          <div key={s.id} className="h-full" title={`${s.name} $${Number(s.budget).toLocaleString('es-AR')}`}
                            style={{ width: `${(Number(s.budget) / totalBudget) * 100}%`, background: ['#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6'][i % 6], opacity: 0.85 }}/>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2 flex-wrap text-[10px]" style={{ color: 'var(--text-3)' }}>
                        {baseBudget > 0 && (
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f97316' }}/>Base</span>
                        )}
                        {subs.filter(s => s.budget && s.add_to_budget).map((s, i) => (
                          <span key={s.id} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: ['#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6'][i % 6] }}/>
                            {s.name.length > 18 ? `${s.name.slice(0, 18)}…` : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {baseBudget > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-3)' }}>Presupuesto base del proyecto</span>
                        <span className="font-semibold text-white">${baseBudget.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {subs.filter(s => s.budget && s.add_to_budget).map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="pl-3 flex items-center gap-1.5" style={{ color: 'var(--text-4)' }}>
                          <span className="w-1 h-1 rounded-full inline-block" style={{ background: 'rgba(249,115,22,0.4)' }} />
                          {s.name}
                        </span>
                        <span className="font-semibold" style={{ color: 'rgba(249,115,22,0.7)' }}>
                          +${Number(s.budget).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-2)' }}>Total del proyecto</span>
                      <span className="text-sm font-black" style={{ color: '#f97316', fontFamily: 'var(--font-display)' }}>
                        ${totalBudget.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal editar subproyecto */}
      <Modal open={!!editingSub} onClose={() => setEditingSub(null)} title="Editar subproyecto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="text-[9px] font-black tracking-widest" style={{ color: '#f97316' }}>
              ↳ SUBPROYECTO DE: {project.name.toUpperCase()}
            </span>
          </div>
          <Input label="Nombre *" value={editSubForm.name} onChange={e => setEditSubForm(f => ({ ...f, name: e.target.value }))} />
          <Select label="Estado" value={editSubForm.status} onChange={e => setEditSubForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planning">Planificando</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </Select>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setEditSubForm(f => ({ ...f, add_to_budget: !f.add_to_budget }))}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                editSubForm.add_to_budget ? 'bg-emerald-400/8 border-emerald-400/30 text-emerald-400' : ''
              }`}
              style={!editSubForm.add_to_budget ? { background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text-3)' } : {}}>
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                editSubForm.add_to_budget ? 'bg-emerald-400 text-[#050c1a]' : ''
              }`}
                style={!editSubForm.add_to_budget ? { background: 'var(--surface-2)', border: '1px solid var(--border)' } : {}}>
                {editSubForm.add_to_budget && <span className="text-[10px] font-black leading-none">✓</span>}
              </div>
              Sumar al precio total del proyecto
            </button>
            <Input label="Precio (ARS)" value={editSubForm.budget} onChange={e => setEditSubForm(f => ({ ...f, budget: e.target.value }))} type="number" placeholder="0" />
          </div>
          <Textarea label="Descripción" value={editSubForm.description} onChange={e => setEditSubForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={saveEditSubproject} disabled={savingEditSub || !editSubForm.name.trim()}>
              {savingEditSub ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="secondary" onClick={() => setEditingSub(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo subproyecto */}
      <Modal open={showSubModal} onClose={() => setShowSubModal(false)} title="Nuevo subproyecto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <FolderKanban size={12} style={{ color: '#f97316' }} className="shrink-0" />
            <p className="text-xs" style={{ color: 'rgba(249,115,22,0.8)' }}>
              Subproyecto de: <strong style={{ color: '#f97316' }}>{project.name}</strong>
            </p>
          </div>
          <Input label="Nombre *" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} placeholder="Fase 1 — Diseño" />
          <Select label="Estado" value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planning">Planning</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </Select>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSubForm(f => ({ ...f, add_to_budget: !f.add_to_budget, budget: !f.add_to_budget ? f.budget : '' }))}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                subForm.add_to_budget ? 'bg-emerald-400/8 border-emerald-400/30 text-emerald-400' : ''
              }`}
              style={!subForm.add_to_budget ? { background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text-3)' } : {}}>
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                subForm.add_to_budget ? 'bg-emerald-400 text-[#050c1a]' : ''
              }`}
                style={!subForm.add_to_budget ? { background: 'var(--surface-2)', border: '1px solid var(--border)' } : {}}>
                {subForm.add_to_budget && <span className="text-[10px] font-black leading-none">✓</span>}
              </div>
              Sumar al precio total del proyecto
            </button>
            <div className={subForm.add_to_budget ? '' : 'opacity-30 pointer-events-none'}>
              <Input label="Presupuesto (ARS)" value={subForm.budget} onChange={e => setSubForm(f => ({ ...f, budget: e.target.value }))} type="number" placeholder="0" />
            </div>
          </div>
          <Textarea label="Descripción" value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Breve descripción del alcance..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={saveSubproject} disabled={savingSub || !subForm.name.trim()}>
              {savingSub ? 'Guardando...' : 'Crear subproyecto'}
            </Button>
            <Button variant="secondary" onClick={() => setShowSubModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
