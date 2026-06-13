'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { UserPlus, Search, ChevronRight, Globe, Copy, Check, X, Star, Users, TrendingUp } from 'lucide-react'

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

const EMPTY = { name: '', email: '', industry: '', status: 'active', contact_person: '', notes: '', legal_name: '', tax_id: '', tax_condition: 'Consumidor Final', fiscal_address: '' }

const TAX_CONDITIONS = ['Consumidor Final', 'Monotributo', 'Responsable Inscripto', 'Exento', 'No Categorizado']

function ratingColor(n: number) {
  if (n >= 9) return '#f59e0b'
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
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
            style={{ background: i < filled ? ratingColor(avg) : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <span className="text-[11px] font-bold font-mono" style={{ color: ratingColor(avg) }}>{avg}</span>
      {count > 1 && <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>({count})</span>}
    </div>
  )
}

function ClientAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
      style={{
        width: size, height: size,
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.2)',
        color: 'var(--amber)',
        fontFamily: 'var(--font-display)',
      }}
    >
      {initial}
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

  const activeCount   = clients.filter(c => c.status === 'active').length
  const prospectCount = clients.filter(c => c.status === 'prospect').length

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${activeCount} activos · ${clients.length} total`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <UserPlus size={14}/> Nuevo cliente
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 animate-fade-up">
          {[
            { icon: <Users size={16}/>, label: 'Clientes activos', value: activeCount, color: '#34d399' },
            { icon: <TrendingUp size={16}/>, label: 'Prospectos', value: prospectCount, color: '#f59e0b' },
            { icon: <Star size={16}/>, label: 'Satisfacción global', value: satisfaction?.globalAvg != null ? `${satisfaction.globalAvg}/10` : '—', color: '#818cf8' },
          ].map((s, i) => (
            <div key={i} className="panel-neon p-4 flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color, boxShadow: `0 0 14px ${s.color}20` }}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-[22px] font-bold mt-0.5 leading-none" style={{ color: s.color, fontFamily: 'var(--font-display)', textShadow: `0 0 14px ${s.color}50` }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Satisfacción global */}
        {satisfaction && satisfaction.totalCount > 0 && (
          <div className="panel-neon flex items-center gap-4 px-5 py-4 animate-fade-up stagger-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ratingColor(satisfaction.globalAvg!)}15`, border: `1px solid ${ratingColor(satisfaction.globalAvg!)}25` }}>
              <Star size={15} style={{ color: ratingColor(satisfaction.globalAvg!) }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Satisfacción general</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black" style={{ color: ratingColor(satisfaction.globalAvg!), fontFamily: 'var(--font-display)' }}>
                  {satisfaction.globalAvg}/10
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full transition-all"
                      style={{ background: i < Math.round(satisfaction.globalAvg!) ? ratingColor(satisfaction.globalAvg!) : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{satisfaction.totalCount}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>ratings</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-3 animate-fade-up stagger-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="prospect">Prospectos</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }} />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
              <UserPlus size={22} style={{ color: 'var(--text-3)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No hay clientes</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Agregá tu primer cliente para empezar</p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm">Agregar cliente</Button>
          </div>
        ) : (
          <div className="panel-neon overflow-hidden animate-fade-up stagger-5">
            <hr className="neon-divider" />
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Email', 'Industria', 'Contacto', 'Estado', 'Rating', 'Hace'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}
                  <th className="w-8"/>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="cursor-pointer group transition-colors animate-fade-up"
                    style={{
                      borderBottom: idx < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      animationDelay: `${0.3 + idx * 0.04}s`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={c.name} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-2)' }}>{c.email || '—'}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-2)' }}>{c.industry || '—'}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-2)' }}>{c.contact_person || '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.status}/></td>
                    <td className="px-5 py-4">
                      {satisfaction?.perClient[c.id]
                        ? <RatingDots avg={satisfaction.perClient[c.id].avg} count={satisfaction.perClient[c.id].count} />
                        : <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-3)' }}>{formatRelative(c.created_at)}</td>
                    <td className="px-3 relative">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => openPortal(e, c.id)}
                          title="Ver portal"
                          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: 'var(--text-3)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                        >
                          <Globe size={13} />
                        </button>
                        <ChevronRight size={14} className="transition-colors opacity-30 group-hover:opacity-100"
                          style={{ color: 'var(--amber)' }} />
                      </div>

                      {/* Popover portal */}
                      {quickPortal?.clientId === c.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl shadow-2xl p-4 animate-scale-in"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                              Portal del cliente
                            </span>
                            <button onClick={() => setQuickPortal(null)}
                              className="transition-colors" style={{ color: 'var(--text-3)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                              <X size={12}/>
                            </button>
                          </div>
                          {quickPortal.loading ? (
                            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Cargando...</p>
                          ) : quickPortal.portal ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 p-2 rounded-lg border"
                                style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
                                <a href={`/portal/${quickPortal.portal.token}`} target="_blank" rel="noreferrer"
                                  className="text-[11px] truncate flex-1 transition-colors hover:underline"
                                  style={{ color: 'var(--amber)' }}>
                                  Abrir portal →
                                </a>
                                <button onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/portal/${quickPortal.portal!.token}`)
                                  setCopied(true); setTimeout(() => setCopied(false), 2000)
                                }} className="shrink-0 transition-colors" style={{ color: 'var(--text-3)' }}>
                                  {copied ? <Check size={11} className="text-emerald-400"/> : <Copy size={11}/>}
                                </button>
                              </div>
                              <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                                PIN: <span className="font-mono font-bold tracking-widest" style={{ color: 'var(--text)' }}>{quickPortal.portal.pin}</span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                              Sin portal.{' '}
                              <a href={`/clients/${c.id}`} className="hover:underline" style={{ color: 'var(--amber)' }}>Crear uno →</a>
                            </p>
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

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Datos fiscales (para facturas)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="CUIT / CUIL / DNI" value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} placeholder="20-12345678-9" />
              <Select label="Condición IVA" value={form.tax_condition} onChange={e => setForm(f => ({ ...f, tax_condition: e.target.value }))}>
                {TAX_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <Input label="Razón social (si difiere del nombre)" value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} placeholder="Empresa S.A." />
            <Input label="Domicilio fiscal" value={form.fiscal_address} onChange={e => setForm(f => ({ ...f, fiscal_address: e.target.value }))} placeholder="Av. Siempreviva 742, CABA" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Guardando...' : 'Crear cliente'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
