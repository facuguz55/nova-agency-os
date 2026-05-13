'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { FolderKanban, Plus, ChevronRight, TrendingUp } from 'lucide-react'

interface Project {
  id: string; name: string; status: string; description: string | null
  budget: number | null; created_at: string; updated_at: string
  clients: { name: string; email: string | null; contact_person: string | null } | null
}

interface Subproject {
  id: string; name: string; status: string; description: string | null; budget: number | null; created_at: string; add_to_budget: boolean
}

const STATUS_COLOR: Record<string, string> = {
  active:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  completed: 'text-[#64748b] bg-[#1a2d45] border-[#253f60]',
  paused:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  planning:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
}
const STATUS_LABEL: Record<string, string> = { active: 'Activo', completed: 'Completado', paused: 'Pausado', planning: 'Planning' }
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

  async function save() {
    setSaving(true)
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:           subForm.name.trim(),
        status:         subForm.status,
        description:    subForm.description || null,
        budget:         subForm.budget ? parseFloat(subForm.budget) : null,
        add_to_budget:  subForm.add_to_budget,
        parent_id:      id,
      }),
    })
    setSubForm(SUB_EMPTY); setShowSubModal(false); setSavingSub(false); loadSubs()
  }

  async function deleteSubproject(subId: string) {
    if (!confirm('¿Eliminar este subproyecto?')) return
    await fetch(`/api/projects/${subId}`, { method: 'DELETE' })
    loadSubs()
  }

  if (!data) return <div className="flex-1 flex items-center justify-center"><p className="text-[#475569]">Cargando...</p></div>

  const { project } = data

  const subsBudget = subs.reduce((acc, s) => acc + (s.add_to_budget ? (Number(s.budget) || 0) : 0), 0)
  const baseBudget = Number(project.budget) || 0
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

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info del proyecto */}
          <div className="lg:col-span-2 bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-4">Información</h3>
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
                  <dt className="text-xs text-[#475569] mb-1">Estado</dt>
                  <dd><StatusBadge status={project.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Presupuesto base</dt>
                  <dd className="text-sm text-white">{baseBudget ? `$${baseBudget.toLocaleString('es-AR')}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Creado</dt>
                  <dd className="text-sm text-white">{formatDate(project.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Actualizado</dt>
                  <dd className="text-sm text-white">{formatDate(project.updated_at)}</dd>
                </div>
                {project.description && (
                  <div className="col-span-2">
                    <dt className="text-xs text-[#475569] mb-1">Descripción</dt>
                    <dd className="text-sm text-[#94a3b8] whitespace-pre-wrap">{project.description}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Cliente */}
          <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-4">Cliente</h3>
            {project.clients ? (
              <dl className="space-y-3">
                <div><dt className="text-xs text-[#475569] mb-1">Nombre</dt><dd className="text-sm text-white">{project.clients.name}</dd></div>
                {project.clients.email && <div><dt className="text-xs text-[#475569] mb-1">Email</dt><dd className="text-sm text-[#94a3b8]">{project.clients.email}</dd></div>}
                {project.clients.contact_person && <div><dt className="text-xs text-[#475569] mb-1">Contacto</dt><dd className="text-sm text-[#94a3b8]">{project.clients.contact_person}</dd></div>}
              </dl>
            ) : (
              <p className="text-sm text-[#475569]">Sin cliente asociado</p>
            )}
          </div>
        </div>

        {/* Subproyectos */}
        <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1a2d45] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={13} className="text-[#f97316]" />
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest">
                Subproyectos
                {subs.length > 0 && <span className="ml-2 text-white/40 normal-case font-normal">({subs.length})</span>}
              </h3>
            </div>
            <button
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#f97316] border border-[#f97316]/30 hover:border-[#f97316]/60 hover:bg-[#f97316]/5 rounded-lg transition-colors"
            >
              <Plus size={11} /> Nuevo subproyecto
            </button>
          </div>

          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a2d45] flex items-center justify-center">
                <FolderKanban size={16} className="text-[#334155]" />
              </div>
              <p className="text-sm text-[#475569]">Sin subproyectos todavía</p>
              <button onClick={() => setShowSubModal(true)} className="text-xs text-[#f97316] hover:text-[#fb923c] transition-colors">
                Crear el primero →
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#1a2d45]/60">
                {subs.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[.015] transition-colors group">
                    <div className="w-1 h-8 rounded-full bg-[#f97316]/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                      {s.description && <p className="text-[11px] text-[#4a6080] truncate mt-0.5">{s.description}</p>}
                    </div>
                    {s.budget && (
                      <span className="text-xs font-medium shrink-0 flex items-center gap-1.5">
                        {s.add_to_budget && (
                          <span className="text-[9px] font-bold text-emerald-400/80 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">+Total</span>
                        )}
                        <span className="text-[#f97316]">${Number(s.budget).toLocaleString('es-AR')}</span>
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_COLOR[s.status] || 'text-[#64748b] bg-[#1a2d45] border-[#253f60]'}`}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/projects/${s.id}`}
                        className="p-1.5 text-[#64748b] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      >
                        <ChevronRight size={13} />
                      </Link>
                      <button
                        onClick={() => deleteSubproject(s.id)}
                        className="p-1.5 text-[#64748b] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de presupuesto */}
              {(baseBudget > 0 || subsBudget > 0) && (
                <div className="border-t border-[#1a2d45] px-5 py-4 bg-[#0a1628]">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={12} className="text-[#f97316]" />
                    <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Resumen presupuesto</span>
                  </div>
                  <div className="space-y-2">
                    {baseBudget > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#475569]">Presupuesto base</span>
                        <span className="text-white font-medium">${baseBudget.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {subs.filter(s => s.budget && s.add_to_budget).map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-[#3a5070] pl-3 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#f97316]/40 inline-block" />
                          {s.name}
                        </span>
                        <span className="text-[#f97316]/70 font-medium">+${Number(s.budget).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a2d45]">
                      <span className="text-xs font-bold text-white/70">Total del proyecto</span>
                      <span className="text-sm font-black text-[#f97316]">${totalBudget.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal nuevo subproyecto */}
      <Modal open={showSubModal} onClose={() => setShowSubModal(false)} title="Nuevo subproyecto">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f97316]/5 border border-[#f97316]/20">
            <FolderKanban size={12} className="text-[#f97316] shrink-0" />
            <p className="text-xs text-[#f97316]/80">Subproyecto de: <strong className="text-[#f97316]">{project.name}</strong></p>
          </div>
          <Input
            label="Nombre *"
            value={subForm.name}
            onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Fase 1 — Diseño"
          />
          <Select label="Estado" value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}>
            <option value="planning">Planning</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
          </Select>
          <div className="space-y-2">
            <Input
              label="Presupuesto (ARS)"
              value={subForm.budget}
              onChange={e => setSubForm(f => ({ ...f, budget: e.target.value }))}
              type="number"
              placeholder="0"
            />
            <button
              type="button"
              onClick={() => setSubForm(f => ({ ...f, add_to_budget: !f.add_to_budget }))}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all text-xs font-medium ${
                subForm.add_to_budget
                  ? 'bg-emerald-400/8 border-emerald-400/30 text-emerald-400'
                  : 'bg-white/[.02] border-[#1a2d45] text-[#475569] hover:border-[#253f60]'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                subForm.add_to_budget ? 'bg-emerald-400 text-[#050c1a]' : 'bg-[#1a2d45] border border-[#253f60]'
              }`}>
                {subForm.add_to_budget && <span className="text-[10px] font-black leading-none">✓</span>}
              </div>
              Agregar al presupuesto total del proyecto
            </button>
          </div>
          <Textarea
            label="Descripción"
            value={subForm.description}
            onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Breve descripción del alcance..."
          />
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
