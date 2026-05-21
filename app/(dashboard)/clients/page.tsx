'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { UserPlus, Search, ChevronRight, Globe, Copy, Check, X } from 'lucide-react'

interface Client {
  id: string; name: string; email: string | null; industry: string | null
  status: string; contact_person: string | null; notes: string | null; created_at: string
}

interface SatisfactionData {
  perClient: Record<string, { avg: number; count: number; latest: string }>
  globalAvg: number | null
  totalCount: number
}

interface QuickPortal { clientId: string; portal: { token: string; pin: string; active: boolean } | null; loading: boolean }

const EMPTY = { name: '', email: '', industry: '', status: 'active', contact_person: '', notes: '' }

function ratingColor(n: number) {
  if (n >= 9) return '#f97316'
  if (n >= 7) return '#34d399'
  if (n >= 5) return '#fbbf24'
  return '#f87171'
}

function RatingDots({ avg, count }: { avg: number; count: number }) {
  const filled = Math.round(avg)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full"
            style={{ background: i < filled ? ratingColor(avg) : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <span className="text-[11px] font-bold" style={{ color: ratingColor(avg) }}>{avg}</span>
      {count > 1 && <span className="text-[10px] text-[#334155]">({count})</span>}
    </div>
  )
}

export default function ClientsPage() {
  usePageTitle('Clientes')
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [quickPortal, setQuickPortal] = useState<QuickPortal | null>(null)
  const [copied, setCopied]       = useState(false)
  const [satisfaction, setSatisfaction] = useState<SatisfactionData | null>(null)
  const router = useRouter()

  async function openPortal(e: React.MouseEvent, clientId: string) {
    e.stopPropagation()
    setQuickPortal({ clientId, portal: null, loading: true })
    const res = await fetch(`/api/clients/${clientId}/portal`)
    const { portal } = await res.json()
    setQuickPortal({ clientId, portal: portal ?? null, loading: false })
  }

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (search) p.set('search', search)
    const [clientsRes, satRes] = await Promise.all([
      fetch(`/api/clients?${p}`),
      fetch('/api/clients/satisfaction'),
    ])
    const { clients: data } = await clientsRes.json()
    const satData = await satRes.json()
    setClients(data || [])
    setSatisfaction(satData.totalCount !== undefined ? satData : null)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function save() {
    setSaving(true)
    await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false); setForm(EMPTY); setSaving(false); load()
  }

  const activeCount = clients.filter(c => c.status === 'active').length

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${activeCount} activos · ${clients.length} total`}
        actions={<Button onClick={() => setShowModal(true)}><UserPlus size={14}/> Nuevo cliente</Button>}
      />

      <div className="flex-1 p-6 space-y-4 bg-grid overflow-y-auto">

        {/* Stat general de satisfacción */}
        {satisfaction && satisfaction.totalCount > 0 && (
          <div className="flex items-center gap-4 px-5 py-3.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${ratingColor(satisfaction.globalAvg!)}15`, border: `1px solid ${ratingColor(satisfaction.globalAvg!)}25` }}>
                <span className="text-base">⭐</span>
              </div>
              <div>
                <p className="text-[10px] text-[#334155] uppercase tracking-widest font-semibold">Satisfacción general</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black" style={{ color: ratingColor(satisfaction.globalAvg!) }}>
                    {satisfaction.globalAvg}/10
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: i < Math.round(satisfaction.globalAvg!) ? ratingColor(satisfaction.globalAvg!) : 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white">{satisfaction.totalCount}</p>
              <p className="text-[10px] text-[#334155]">ratings recibidos</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#334155]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-white placeholder-[#334155] text-sm focus:outline-none focus:border-[#ff8c42]/40 transition-all"
            />
          </div>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40 transition-all"
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="prospect">Prospectos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
              <UserPlus size={20} className="text-[#334155]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[#475569]">No hay clientes</p>
              <p className="text-xs text-[#334155] mt-1">Agregá tu primer cliente para empezar</p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar cliente</Button>
          </div>
        ) : (
          <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            {/* Top line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e2f4a] to-transparent" />
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2f4a]">
                  {['Nombre', 'Email', 'Industria', 'Contacto', 'Estado', 'Rating', 'Hace'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] text-[#334155] uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                  <th className="w-8"/>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="border-b border-[#1e2f4a]/50 hover:bg-white/[.02] cursor-pointer transition-colors group last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ff8c42]/10 border border-[#ff8c42]/20 flex items-center justify-center text-sm font-bold text-[#ff8c42] shrink-0 group-hover:shadow-[0_0_10px_rgba(255,140,66,.2)] transition-all">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.email || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.industry || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{c.contact_person || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.status}/></td>
                    <td className="px-5 py-4">
                      {satisfaction?.perClient[c.id]
                        ? <RatingDots avg={satisfaction.perClient[c.id].avg} count={satisfaction.perClient[c.id].count} />
                        : <span className="text-[11px] text-[#1e2f4a]">—</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-xs text-[#334155]">{formatRelative(c.created_at)}</td>
                    <td className="px-3 relative">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => openPortal(e, c.id)}
                          title="Ver portal"
                          className="p-1 text-[#1e2f4a] hover:text-[#f97316] transition-colors rounded opacity-0 group-hover:opacity-100"
                        >
                          <Globe size={13} />
                        </button>
                        <ChevronRight size={14} className="text-[#1e2f4a] group-hover:text-[#ff8c42] transition-colors"/>
                      </div>
                      {/* Popover */}
                      {quickPortal?.clientId === c.id && (
                        <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 z-50 w-64 bg-[#0f1d30] border border-[#1a2d45] rounded-xl shadow-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Portal del cliente</span>
                            <button onClick={() => setQuickPortal(null)} className="text-[#334155] hover:text-white transition-colors"><X size={12}/></button>
                          </div>
                          {quickPortal.loading ? (
                            <p className="text-xs text-[#475569]">Cargando...</p>
                          ) : quickPortal.portal ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 p-2 bg-[#080f1e] rounded-lg border border-[#1a2d45]">
                                <a href={`/portal/${quickPortal.portal.token}`} target="_blank" rel="noreferrer"
                                  className="text-[11px] text-[#f97316] hover:text-[#fb923c] truncate flex-1 transition-colors">
                                  Abrir portal →
                                </a>
                                <button onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/portal/${quickPortal.portal!.token}`)
                                  setCopied(true); setTimeout(() => setCopied(false), 2000)
                                }} className="shrink-0 text-[#4a6080] hover:text-white transition-colors">
                                  {copied ? <Check size={11} className="text-emerald-400"/> : <Copy size={11}/>}
                                </button>
                              </div>
                              <p className="text-xs text-[#475569]">
                                PIN: <span className="text-white font-mono font-bold tracking-widest">{quickPortal.portal.pin}</span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#475569]">Sin portal. <a href={`/clients/${c.id}`} className="text-[#f97316] hover:underline">Crear uno →</a></p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo cliente">
        <div className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Empresa SA" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" type="email" />
            <Input label="Industria" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="E-commerce" />
          </div>
          <Input label="Persona de contacto" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Juan García" />
          <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="prospect">Prospecto</option>
          </Select>
          <Textarea label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Información adicional..." rows={3} />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Guardando...' : 'Crear cliente'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
