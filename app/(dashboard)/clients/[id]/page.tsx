'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate, cn } from '@/lib/utils'
import { Sparkles, Loader2, Globe, Copy, Check } from 'lucide-react'

interface Portal { id: string; token: string; pin: string; active: boolean; created_at: string }

interface Scorecard {
  score: number; nivel: string; resumen: string
  fortalezas: string[]; riesgos: string[]; acciones: string[]
}

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
  const [saving, setSaving]       = useState(false)
  const [scorecard, setScorecard]     = useState<Scorecard | null>(null)
  const [loadingScore, setLoadingScore] = useState(false)
  const [portal, setPortal]           = useState<Portal | null | undefined>(undefined)
  const [creatingPortal, setCreatingPortal] = useState(false)
  const [copied, setCopied]           = useState(false)

  async function analyzeClient() {
    setLoadingScore(true)
    const res = await fetch(`/api/clients/${id}/scorecard`)
    const { scorecard: sc } = await res.json()
    setScorecard(sc)
    setLoadingScore(false)
  }

  async function load() {
    const res = await fetch(`/api/clients/${id}`)
    const json = await res.json()
    setData(json)
    setForm(json.client)
  }

  async function loadPortal() {
    const res = await fetch(`/api/clients/${id}/portal`)
    const json = await res.json()
    setPortal(json.portal ?? null)
  }

  async function createPortal() {
    setCreatingPortal(true)
    const res = await fetch(`/api/clients/${id}/portal`, { method: 'POST' })
    const json = await res.json()
    setPortal(json.portal)
    setCreatingPortal(false)
  }

  function copyPortalUrl() {
    if (!portal) return
    navigator.clipboard.writeText(`${window.location.origin}/portal/${portal.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => { load(); loadPortal() }, [id])

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
                <Button variant="secondary" onClick={analyzeClient} disabled={loadingScore} size="sm">
                  {loadingScore ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {loadingScore ? 'Analizando...' : 'Scorecard IA'}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(true)} size="sm">Editar</Button>
                <Button variant="danger" onClick={deleteClient} size="sm">Eliminar</Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Scorecard IA */}
        {scorecard && (
          <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black border-2',
                  scorecard.score >= 8 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : scorecard.score >= 6 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : scorecard.score >= 4 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                )}>
                  {scorecard.score}
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-widest">Scorecard IA</p>
                  <p className="text-base font-bold text-white">{scorecard.nivel}</p>
                </div>
              </div>
              <button onClick={() => setScorecard(null)} className="text-[#334155] hover:text-[#64748b] text-xs px-2 py-1 border border-[#1a2d45] rounded-lg">×</button>
            </div>
            <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">{scorecard.resumen}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Fortalezas', items: scorecard.fortalezas, color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { label: 'Riesgos', items: scorecard.riesgos, color: 'text-red-400', dot: 'bg-red-400' },
                { label: 'Acciones', items: scorecard.acciones, color: 'text-[#f97316]', dot: 'bg-[#f97316]' },
              ].map(({ label, items, color, dot }) => (
                <div key={label} className="bg-[#080f1e] border border-[#1a2d45] rounded-lg p-3">
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', color)}>{label}</p>
                  <ul className="space-y-1.5">
                    {items?.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#94a3b8]">
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dot)} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Portal del cliente */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#f97316]" />
              <h3 className="text-sm font-semibold text-white">Portal del cliente</h3>
            </div>
            {portal && (
              <a
                href={`/portal/${portal.token}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors"
              >
                Ver portal →
              </a>
            )}
          </div>

          {portal === undefined && (
            <p className="text-xs text-[#475569]">Cargando...</p>
          )}

          {portal === null && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <p className="text-sm text-[#475569]">Este cliente todavía no tiene portal.</p>
              <button
                onClick={createPortal}
                disabled={creatingPortal}
                className="flex items-center gap-2 px-4 py-2 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {creatingPortal ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                {creatingPortal ? 'Creando...' : 'Crear portal'}
              </button>
            </div>
          )}

          {portal && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-[#0f172a] rounded-xl border border-[#1a2d45]">
                <a
                  href={`/portal/${portal.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-xs text-[#94a3b8] hover:text-[#f97316] truncate transition-colors"
                >
                  {typeof window !== 'undefined' ? window.location.origin : ''}/portal/{portal.token}
                </a>
                <button
                  onClick={copyPortalUrl}
                  className="shrink-0 text-[#4a6080] hover:text-white transition-colors"
                  title="Copiar URL"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#475569]">
                <span>PIN de acceso: <span className="text-white font-mono font-bold text-sm tracking-widest">{portal.pin}</span></span>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', portal.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                  {portal.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
