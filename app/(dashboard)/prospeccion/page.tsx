'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { cn, formatRelative } from '@/lib/utils'
import { Plus, ExternalLink, Search, Users, MessageSquare, TrendingUp } from 'lucide-react'

type EstadoProspecto = 'enviado' | 'respondió' | 'interesado' | 'no_interesa' | 'cerrado'

interface Prospecto {
  id: string
  username: string
  nombre_marca: string | null
  ig_profile_url: string | null
  ig_thread_url: string | null
  mensaje_enviado: string | null
  fecha_envio: string
  estado: EstadoProspecto
  notas: string | null
  created_at: string
}

const EMPTY_FORM = {
  username: '', nombre_marca: '', ig_profile_url: '', ig_thread_url: '', mensaje_enviado: '', notas: '',
}

const ESTADOS: EstadoProspecto[] = ['enviado', 'respondió', 'interesado', 'no_interesa', 'cerrado']
const PANEL = { background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16 }

export default function ProspeccionPage() {
  usePageTitle('Prospección')
  const [prospectos, setProspectos]         = useState<Prospecto[]>([])
  const [loading, setLoading]               = useState(true)
  const [estadoFilter, setEstadoFilter]     = useState('')
  const [search, setSearch]                 = useState('')
  const [showModal, setShowModal]           = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [saving, setSaving]                 = useState(false)
  const [editingEstado, setEditingEstado]   = useState<string | null>(null)
  const [editingNotas, setEditingNotas]     = useState<string | null>(null)
  const [notasDraft, setNotasDraft]         = useState('')

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (estadoFilter) p.set('estado', estadoFilter)
    if (search)       p.set('search', search)
    const res = await fetch(`/api/prospeccion?${p}`)
    const { prospectos: data } = await res.json()
    setProspectos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, estadoFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true)
    await fetch('/api/prospeccion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setShowModal(false); setForm(EMPTY_FORM); setSaving(false); load()
  }

  async function updateEstado(id: string, estado: string) {
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, estado: estado as EstadoProspecto } : p))
    setEditingEstado(null)
    await fetch(`/api/prospeccion/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }),
    })
  }

  async function saveNotas(id: string) {
    setProspectos(prev => prev.map(p => p.id === id ? { ...p, notas: notasDraft } : p))
    setEditingNotas(null)
    await fetch(`/api/prospeccion/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notas: notasDraft }),
    })
  }

  const total        = prospectos.length
  const respondieron = prospectos.filter(p => ['respondió', 'interesado', 'cerrado'].includes(p.estado)).length
  const interesados  = prospectos.filter(p => p.estado === 'interesado').length

  return (
    <>
      <Header
        title="Prospección"
        subtitle={`${total} prospectos · ${interesados} interesados`}
        actions={<Button onClick={() => setShowModal(true)}><Plus size={14} /> Nuevo prospecto</Button>}
      />

      <div className="flex-1 p-6 space-y-5 bg-grid overflow-y-auto">

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total enviados" value={total} icon={<Users size={16} />} color="amber" sub="mensajes enviados" />
          <StatCard label="Respondieron" value={respondieron} icon={<MessageSquare size={16} />} color="blue"
            sub={total ? `${Math.round((respondieron / total) * 100)}% tasa de respuesta` : 'sin datos aún'} />
          <StatCard label="Interesados" value={interesados} icon={<TrendingUp size={16} />} color="green" sub="listos para cerrar" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por usuario o marca..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }} />
          </div>
          <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prospectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <Users size={20} className="text-[var(--text-4)]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-3)]">No hay prospectos</p>
              <p className="text-xs text-[var(--text-4)] mt-1">Cargá tu primer prospecto para empezar</p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar prospecto</Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={PANEL}>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Usuario', 'Marca', 'Mensaje enviado', 'Fecha', 'Estado', 'Notas', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[10px] text-[var(--text-4)] uppercase tracking-widest font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prospectos.map(p => (
                    <tr key={p.id} className="hover:bg-white/[.02] transition-colors last:border-0"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--amber)' }}>
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">@{p.username}</p>
                            {p.ig_profile_url && (
                              <a href={p.ig_profile_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className="text-[10px] text-[var(--text-4)] hover:text-[var(--amber)] transition-colors">
                                ver perfil ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--text-3)] whitespace-nowrap">{p.nombre_marca || '—'}</td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-xs text-[var(--text-3)] line-clamp-2">{p.mensaje_enviado || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-4)] whitespace-nowrap">{formatRelative(p.fecha_envio)}</td>
                      <td className="px-5 py-4">
                        {editingEstado === p.id ? (
                          <select autoFocus value={p.estado} onChange={e => updateEstado(p.id, e.target.value)}
                            onBlur={() => setEditingEstado(null)}
                            className="rounded-xl text-xs text-white px-2 py-1.5 focus:outline-none transition-all"
                            style={{ background: 'var(--bg)', border: '1px solid rgba(245,158,11,0.3)' }}>
                            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        ) : (
                          <button onClick={() => setEditingEstado(p.id)} className="cursor-pointer hover:opacity-75 transition-opacity" title="Click para cambiar estado">
                            <StatusBadge status={p.estado} />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        {editingNotas === p.id ? (
                          <div className="flex flex-col gap-1">
                            <textarea autoFocus value={notasDraft} onChange={e => setNotasDraft(e.target.value)} rows={2}
                              className="w-full px-2 py-1 text-xs rounded-lg text-white resize-none focus:outline-none transition-all"
                              style={{ background: 'var(--bg)', border: '1px solid rgba(245,158,11,0.3)' }} />
                            <div className="flex gap-2">
                              <button onClick={() => saveNotas(p.id)} className="text-[10px] text-green-400 hover:text-green-300 font-medium transition-colors">guardar</button>
                              <button onClick={() => setEditingNotas(null)} className="text-[10px] text-[var(--text-4)] hover:text-[var(--text-3)] font-medium transition-colors">cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => { setEditingNotas(p.id); setNotasDraft(p.notas || '') }}
                            className={cn('text-xs cursor-pointer rounded-lg px-1.5 py-1 min-h-[28px] transition-all group', 'hover:bg-white/[.03]')}
                            title="Click para editar">
                            {p.notas ? (
                              <span className="text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors line-clamp-2">{p.notas}</span>
                            ) : (
                              <span className="text-[var(--text-4)] group-hover:text-[var(--text-3)] italic transition-colors">agregar nota...</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {p.ig_thread_url ? (
                          <a href={p.ig_thread_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--amber)] rounded-lg transition-all whitespace-nowrap"
                            style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <ExternalLink size={11} /> Abrir chat IG
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--text-4)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo prospecto" size="lg">
        <div className="space-y-4">
          <Input label="Username de Instagram *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="@marca.ejemplo" />
          <Input label="Nombre de la marca" value={form.nombre_marca} onChange={e => setForm(f => ({ ...f, nombre_marca: e.target.value }))} placeholder="Marca Ejemplo SA" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="URL del perfil IG" value={form.ig_profile_url} onChange={e => setForm(f => ({ ...f, ig_profile_url: e.target.value }))} placeholder="https://instagram.com/..." />
            <Input label="URL del chat / thread IG" value={form.ig_thread_url} onChange={e => setForm(f => ({ ...f, ig_thread_url: e.target.value }))} placeholder="https://instagram.com/direct/..." />
          </div>
          <Textarea label="Mensaje enviado" value={form.mensaje_enviado} onChange={e => setForm(f => ({ ...f, mensaje_enviado: e.target.value }))} rows={3} placeholder="Hola! Vi tu perfil y me interesaría hablar sobre..." />
          <Textarea label="Notas" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} placeholder="Información adicional..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.username.trim()}>{saving ? 'Guardando...' : 'Crear prospecto'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
