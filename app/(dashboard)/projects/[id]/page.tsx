'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface ProjectData {
  project: {
    id: string; name: string; status: string; description: string | null
    budget: number | null; created_at: string; updated_at: string
    clients: { name: string; email: string | null; contact_person: string | null } | null
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ProjectData | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<ProjectData['project']>>({})
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch(`/api/projects/${id}`)
    const json = await res.json()
    setData(json)
    setForm(json.project)
  }

  useEffect(() => { load() }, [id])

  async function save() {
    setSaving(true)
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    load()
  }

  async function deleteProject() {
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  if (!data) return <div className="flex-1 flex items-center justify-center"><p className="text-[#475569]">Cargando...</p></div>

  const { project } = data

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

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Información del proyecto</h3>
            {editing ? (
              <div className="space-y-4">
                <Input label="Nombre" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select label="Estado" value={form.status || 'planning'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="planning">Planning</option>
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="paused">Pausado</option>
                </Select>
                <Input label="Presupuesto (USD)" value={form.budget?.toString() || ''} onChange={e => setForm(f => ({ ...f, budget: parseFloat(e.target.value) || null }))} type="number" />
                <Textarea label="Descripción" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Estado</dt>
                  <dd><StatusBadge status={project.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Presupuesto</dt>
                  <dd className="text-sm text-white">{project.budget ? `$${project.budget.toLocaleString()}` : '—'}</dd>
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

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Cliente</h3>
            {project.clients ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-[#475569] mb-1">Nombre</dt>
                  <dd className="text-sm text-white">{project.clients.name}</dd>
                </div>
                {project.clients.email && (
                  <div>
                    <dt className="text-xs text-[#475569] mb-1">Email</dt>
                    <dd className="text-sm text-[#94a3b8]">{project.clients.email}</dd>
                  </div>
                )}
                {project.clients.contact_person && (
                  <div>
                    <dt className="text-xs text-[#475569] mb-1">Contacto</dt>
                    <dd className="text-sm text-[#94a3b8]">{project.clients.contact_person}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-[#475569]">Sin cliente asociado</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
