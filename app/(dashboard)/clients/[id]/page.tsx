'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface ClientData {
  client: {
    id: string; name: string; email: string | null; industry: string | null
    status: string; contact_person: string | null; notes: string | null
    created_at: string; updated_at: string
  }
  projects: Array<{ id: string; name: string; status: string; budget: number | null; created_at: string }>
  automations: Array<{ id: string; name: string; status: string; trigger_type: string }>
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ClientData | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<ClientData['client']>>({})
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch(`/api/clients/${id}`)
    const json = await res.json()
    setData(json)
    setForm(json.client)
  }

  useEffect(() => { load() }, [id])

  async function save() {
    setSaving(true)
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    load()
  }

  async function deleteClient() {
    if (!confirm('¿Eliminar este cliente? Se eliminarán también sus proyectos.')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    router.push('/clients')
  }

  if (!data) return <div className="flex-1 flex items-center justify-center"><p className="text-[#475569]">Cargando...</p></div>

  const { client, projects, automations } = data

  return (
    <>
      <Header
        title={client.name}
        subtitle="Detalle del cliente"
        actions={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={save} disabled={saving} size="sm">{saving ? 'Guardando...' : 'Guardar'}</Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setForm(client) }} size="sm">Cancelar</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)} size="sm">Editar</Button>
                <Button variant="danger" onClick={deleteClient} size="sm">Eliminar</Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info principal */}
          <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Información</h3>
            {editing ? (
              <div className="space-y-4">
                <Input label="Nombre" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Input label="Email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                <Input label="Industria" value={form.industry || ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
                <Input label="Contacto" value={form.contact_person || ''} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                <Select label="Estado" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="prospect">Prospecto</option>
                </Select>
                <Textarea label="Notas" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                {[
                  ['Email', client.email || '—'],
                  ['Industria', client.industry || '—'],
                  ['Contacto', client.contact_person || '—'],
                  ['Estado', null],
                  ['Creado', formatDate(client.created_at)],
                  ['Actualizado', formatDate(client.updated_at)],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-xs text-[#475569] mb-1">{k}</dt>
                    <dd className="text-sm text-white">
                      {k === 'Estado' ? <StatusBadge status={client.status} /> : v}
                    </dd>
                  </div>
                ))}
                {client.notes && (
                  <div className="col-span-2">
                    <dt className="text-xs text-[#475569] mb-1">Notas</dt>
                    <dd className="text-sm text-[#94a3b8] whitespace-pre-wrap">{client.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <p className="text-xs text-[#475569] mb-1">Proyectos</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
              <p className="text-xs text-[#475569]">{projects.filter(p => p.status === 'active').length} activos</p>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <p className="text-xs text-[#475569] mb-1">Automatizaciones</p>
              <p className="text-2xl font-bold text-white">{automations.length}</p>
              <p className="text-xs text-[#475569]">{automations.filter(a => a.status === 'active').length} activas</p>
            </div>
          </div>
        </div>

        {/* Proyectos */}
        {projects.length > 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Proyectos</h3>
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#334155]/50 cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-[#475569]">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.budget && <span className="text-sm text-[#94a3b8]">${p.budget.toLocaleString()}</span>}
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automatizaciones */}
        {automations.length > 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Automatizaciones</h3>
            <div className="space-y-2">
              {automations.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a]/50">
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-[#475569]">Trigger: {a.trigger_type}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
