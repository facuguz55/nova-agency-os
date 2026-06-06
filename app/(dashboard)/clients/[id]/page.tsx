'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import { formatDate, cn } from '@/lib/utils'
import { Sparkles, Loader2, Globe, Copy, Check } from 'lucide-react'

interface Portal { id: string; token: string; pin: string; active: boolean; created_at: string }
interface RoadmapWeek { id?: string; week: number; title: string; items: string[] }

interface Scorecard {
  score: number; nivel: string; resumen: string
  fortalezas: string[]; riesgos: string[]; acciones: string[]
}

interface ClientInvoice {
  id: string; invoice_number: string; amount: number; status: string
  description: string | null; due_date: string | null; paid_at: string | null
  paid_amount?: number
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

const SECTION = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 16,
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ClientData | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<ClientData['client']>>({})
  const [saving, setSaving]           = useState(false)
  const [scorecard, setScorecard]     = useState<Scorecard | null>(null)
  const [loadingScore, setLoadingScore] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl]       = useState<string | null>(null)
  const [portal, setPortal]           = useState<Portal | null | undefined>(undefined)
  const [creatingPortal, setCreatingPortal] = useState(false)
  const [copied, setCopied]           = useState(false)
  const now = new Date()
  const [roadmapMonth] = useState(now.getMonth() + 1)
  const [roadmapYear]  = useState(now.getFullYear())
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const emptyWeeks = (): RoadmapWeek[] => [1,2,3,4].map(w => ({ week: w, title: '', items: [] }))
  const [roadmapData, setRoadmapData]     = useState<RoadmapWeek[]>(emptyWeeks())
  const [savingRoadmap, setSavingRoadmap] = useState(false)
  const [roadmapSaved, setRoadmapSaved]   = useState(false)
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([])

  async function analyzeClient() {
    setLoadingScore(true)
    const res = await fetch(`/api/clients/${id}/scorecard`)
    const { scorecard: sc } = await res.json()
    setScorecard(sc)
    setLoadingScore(false)
  }

  async function load() {
    const [clientRes, invRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/invoices?client_id=${id}`),
    ])
    const json    = await clientRes.json()
    const invData = await invRes.json()
    setData(json)
    setForm(json.client)
    setPhotoUrl(json.client?.photo_url ?? null)
    setClientInvoices(invData.invoices || [])
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/clients/${id}/photo`, { method: 'POST', body: fd })
    const { photo_url } = await res.json()
    if (photo_url) setPhotoUrl(photo_url)
    setUploadingPhoto(false)
  }

  async function deletePhoto() {
    await fetch(`/api/clients/${id}/photo`, { method: 'DELETE' })
    setPhotoUrl(null)
  }

  async function loadPortal() {
    const res = await fetch(`/api/clients/${id}/portal`)
    const json = await res.json()
    setPortal(json.portal ?? null)
  }

  async function loadRoadmap() {
    const res  = await fetch(`/api/clients/${id}/roadmap?month=${roadmapMonth}&year=${roadmapYear}`)
    const json = await res.json()
    if (json.roadmap?.length) {
      const base = emptyWeeks()
      json.roadmap.forEach((w: RoadmapWeek) => {
        const idx = base.findIndex(b => b.week === w.week)
        if (idx !== -1) base[idx] = w
      })
      setRoadmapData(base)
    }
  }

  async function saveRoadmap() {
    setSavingRoadmap(true)
    await Promise.all(
      roadmapData
        .filter(w => w.title.trim() || w.items.some(i => i.trim()))
        .map(w => fetch(`/api/clients/${id}/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...w, month: roadmapMonth, year: roadmapYear }),
        }))
    )
    setSavingRoadmap(false)
    setRoadmapSaved(true)
    setTimeout(() => setRoadmapSaved(false), 2500)
  }

  function updateWeek(week: number, field: 'title' | 'items', value: string | string[]) {
    setRoadmapData(prev => prev.map(w => w.week === week ? { ...w, [field]: value } : w))
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

  useEffect(() => { load(); loadPortal(); loadRoadmap() }, [id])

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

  if (!data) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }} />
    </div>
  )

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

      <div className="flex-1 p-6 space-y-5 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* Foto del cliente */}
        <div className="p-5 rounded-2xl border animate-fade-up" style={SECTION}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
            Foto / Logo del cliente
          </p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              {photoUrl
                ? <img src={photoUrl} alt="foto cliente" className="w-full h-full object-cover" />
                : <span className="text-2xl">🏢</span>
              }
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }}
                />
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  uploadingPhoto ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                  style={{ borderColor: 'rgba(249,115,22,0.3)', color: '#f97316', background: 'rgba(249,115,22,0.08)' }}>
                  {uploadingPhoto ? '⏳ Subiendo...' : '📷 Subir foto'}
                </span>
              </label>
              {photoUrl && (
                <button onClick={deletePhoto} className="text-[11px] text-left transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}>
                  Eliminar foto
                </button>
              )}
              <p className="text-[10px] leading-tight" style={{ color: 'var(--text-4)' }}>
                Se usa como fondo sutil en los videos generados y para extraer colores de marca.
              </p>
            </div>
          </div>
        </div>

        {/* Scorecard IA */}
        {scorecard && (
          <div className="rounded-2xl border p-5 animate-fade-up stagger-1" style={SECTION}>
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
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Scorecard IA</p>
                  <p className="text-base font-bold text-white">{scorecard.nivel}</p>
                </div>
              </div>
              <button onClick={() => setScorecard(null)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>×</button>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-2)' }}>{scorecard.resumen}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Fortalezas', items: scorecard.fortalezas, color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { label: 'Riesgos',    items: scorecard.riesgos,    color: 'text-red-400',     dot: 'bg-red-400' },
                { label: 'Acciones',   items: scorecard.acciones,   color: 'text-[#f97316]',   dot: 'bg-[#f97316]' },
              ].map(({ label, items, color, dot }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', color)}>{label}</p>
                  <ul className="space-y-1.5">
                    {items?.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Info principal */}
          <div className="lg:col-span-2 rounded-2xl border p-5 animate-fade-up stagger-2" style={SECTION}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Información</h3>
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
                    <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{k}</dt>
                    <dd className="text-sm text-white">
                      {k === 'Estado' ? <StatusBadge status={client.status} /> : v}
                    </dd>
                  </div>
                ))}
                {client.notes && (
                  <div className="col-span-2">
                    <dt className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Notas</dt>
                    <dd className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{client.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4 animate-fade-up stagger-3">
            {[
              { label: 'Proyectos', value: projects.length, sub: `${projects.filter(p => p.status === 'active').length} activos` },
              { label: 'Automatizaciones', value: automations.length, sub: `${automations.filter(a => a.status === 'active').length} activas` },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border p-5" style={SECTION}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Proyectos */}
        {projects.length > 0 && (
          <div className="rounded-2xl border p-5 animate-fade-up stagger-4" style={SECTION}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Proyectos</h3>
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.budget && <span className="text-sm font-bold" style={{ color: 'var(--amber)' }}>${p.budget.toLocaleString()}</span>}
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automatizaciones */}
        {automations.length > 0 && (
          <div className="rounded-2xl border p-5 animate-fade-up stagger-5" style={SECTION}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Automatizaciones</h3>
            <div className="space-y-2">
              {automations.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Trigger: {a.trigger_type}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facturación del cliente */}
        {clientInvoices.length > 0 && (() => {
          const cobrado   = clientInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
          const porCobrar = clientInvoices.filter(i => ['pending','partial'].includes(i.status)).reduce((s, i) => s + Number(i.amount) - (i.paid_amount || 0), 0)
          const total     = clientInvoices.reduce((s, i) => s + Number(i.amount), 0)
          return (
            <div className="rounded-2xl border p-5 animate-fade-up stagger-6" style={SECTION}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Facturación</h3>
                <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                  {clientInvoices.length} factura{clientInvoices.length !== 1 ? 's' : ''} · ${total.toLocaleString()} total
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Cobrado',    value: cobrado,   color: '#10b981' },
                  { label: 'Por cobrar', value: porCobrar, color: 'var(--amber)' },
                  { label: 'Total',      value: total,     color: 'var(--text)' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                    <p className="text-lg font-black" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>
                      ${s.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {clientInvoices.slice(0, 5).map(inv => {
                  const resta = Math.max(0, Number(inv.amount) - (inv.paid_amount || 0))
                  return (
                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                          {inv.invoice_number}
                        </span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                          {inv.description || 'Sin descripción'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {inv.status !== 'paid' && resta > 0 && (
                          <span className="text-[11px] font-semibold text-amber-400">Resta ${resta.toLocaleString()}</span>
                        )}
                        <span className="text-sm font-bold text-white">${Number(inv.amount).toLocaleString()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          inv.status === 'paid'    ? 'bg-emerald-500/10 text-emerald-400' :
                          inv.status === 'overdue' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-400/10 text-amber-400'
                        }`}>
                          {inv.status === 'paid' ? 'Pagada' : inv.status === 'overdue' ? 'Vencida' : inv.status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {clientInvoices.length > 5 && (
                <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-4)' }}>
                  +{clientInvoices.length - 5} facturas más · Ver en Facturación
                </p>
              )}
            </div>
          )
        })()}

        {/* Roadmap del mes */}
        <div className="rounded-2xl border p-5 animate-fade-up stagger-7" style={SECTION}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Roadmap del mes</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                Lo que vas a hacer semana a semana — visible en el portal del cliente
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              {MONTH_NAMES[roadmapMonth - 1]} {roadmapYear}
            </span>
          </div>

          <div className="space-y-3">
            {roadmapData.map((w) => (
              <div key={w.week} className="rounded-xl p-4" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-black"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
                    S{w.week}
                  </div>
                  <input
                    value={w.title}
                    onChange={e => updateWeek(w.week, 'title', e.target.value)}
                    placeholder={`Título semana ${w.week} (ej: Desarrollo del CRM)`}
                    className="flex-1 bg-transparent text-sm text-white outline-none font-medium placeholder-[#383838]"
                  />
                </div>
                <textarea
                  value={w.items.join('\n')}
                  onChange={e => updateWeek(w.week, 'items', e.target.value.split('\n'))}
                  placeholder="Una tarea por línea..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg text-xs outline-none resize-none placeholder-[#383838]"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveRoadmap}
            disabled={savingRoadmap}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: roadmapSaved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg, #f97316, #fb923c)' }}>
            {roadmapSaved ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Guardado</>
            ) : savingRoadmap ? 'Guardando...' : 'Guardar roadmap'}
          </button>
        </div>

        {/* Portal del cliente */}
        <div className="rounded-2xl border p-5 animate-fade-up stagger-8" style={SECTION}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={14} style={{ color: '#f97316' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Portal del cliente</h3>
            </div>
            {portal && (
              <a href={`/portal/${portal.token}`} target="_blank" rel="noreferrer"
                className="text-[11px] transition-colors"
                style={{ color: '#f97316' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                Ver portal →
              </a>
            )}
          </div>

          {portal === undefined && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Cargando...</p>
          )}

          {portal === null && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Este cliente todavía no tiene portal.</p>
              <button
                onClick={createPortal}
                disabled={creatingPortal}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                {creatingPortal ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                {creatingPortal ? 'Creando...' : 'Crear portal'}
              </button>
            </div>
          )}

          {portal && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <a href={`/portal/${portal.token}`} target="_blank" rel="noreferrer"
                  className="flex-1 text-xs truncate transition-colors"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f97316'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/portal/{portal.token}
                </a>
                <button onClick={copyPortalUrl} className="shrink-0 transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}>
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
                <span>PIN: <span className="text-white font-mono font-bold text-sm tracking-widest">{portal.pin}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${portal.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
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
