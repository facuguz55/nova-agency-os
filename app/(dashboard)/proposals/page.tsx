'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative, cn } from '@/lib/utils'
import { Plus, Copy, Trash2, FileSignature, ChevronDown, Sparkles, Pencil } from 'lucide-react'

interface Client {
  id: string; name: string; industry: string | null; notes: string | null; email: string | null
}
interface Proposal {
  id: string; title: string; status: 'draft' | 'sent' | 'accepted' | 'rejected'
  client_id: string | null; amount: number | null; content: string | null
  service: string | null; created_at: string
  clients: { name: string; industry: string | null; notes: string | null; email: string | null } | null
}

const STATUS_LABEL: Record<string, string> = {
  draft:    'Borrador',
  sent:     'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
}
const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-white/5 text-[var(--text-3)] border-white/10',
  sent:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', STATUS_BADGE[status] || STATUS_BADGE.draft)}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

const EMPTY_FORM = { client_id: '', service: '', budget: '', title: '', content: '' }
const CARD = { background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12 }

export default function ProposalsPage() {
  usePageTitle('Propuestas')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Proposal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  async function load() {
    setLoading(true)
    const [pRes, cRes] = await Promise.all([fetch('/api/proposals'), fetch('/api/clients')])
    const [p, c] = await Promise.all([pRes.json(), cRes.json()])
    const list = p.proposals || []
    setProposals(list); setClients(c.clients || [])
    if (!selected && list.length > 0) setSelected(list[0])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function generateProposal() {
    if (!form.client_id || !form.service) return
    setGenerating(true)
    const res = await fetch('/api/proposals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generate: true, client_id: form.client_id, service: form.service, budget: form.budget || null }),
    })
    const { proposal } = await res.json()
    setGenerating(false); setShowModal(false); setForm(EMPTY_FORM)
    await load(); if (proposal) setSelected(proposal)
  }

  async function createManual() {
    if (!form.title) return
    setSaving(true)
    const res = await fetch('/api/proposals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, content: form.content, client_id: form.client_id || null, service: form.service || null }),
    })
    const { proposal } = await res.json()
    setSaving(false); setShowModal(false); setForm(EMPTY_FORM)
    await load(); if (proposal) setSelected(proposal)
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const { proposal } = await res.json()
    setProposals(ps => ps.map(p => p.id === id ? proposal : p))
    setSelected(proposal); setStatusOpen(false)
  }

  async function deleteProposal(id: string) {
    if (!confirm('¿Eliminás esta propuesta?')) return
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
    setSelected(null); load()
  }

  function copy(text: string) { navigator.clipboard.writeText(text) }

  const STATUS_ACTIONS = ['sent', 'accepted', 'rejected'] as const

  return (
    <>
      <Header
        title="Propuestas"
        subtitle={`${proposals.length} propuesta${proposals.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus size={13} /> Nueva propuesta
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden bg-grid">
        {/* Lista izquierda */}
        <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest">Propuestas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
                <FileSignature size={28} className="text-[var(--text-4)]" />
                <p className="text-xs text-[var(--text-4)] text-center">Sin propuestas. Generá una con IA.</p>
              </div>
            ) : proposals.map(p => (
              <div key={p.id} onClick={() => setSelected(p)}
                className={cn(
                  'p-3 cursor-pointer transition-colors',
                  selected?.id === p.id ? 'bg-[var(--amber)]/5 border-l-2 border-l-[var(--amber)]' : 'hover:bg-white/[.02]',
                )}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <p className="text-sm font-medium text-white truncate">{p.title}</p>
                <div className="flex items-center justify-between mt-1.5 gap-2">
                  <StatusBadge status={p.status} />
                  <span className="text-[10px] text-[var(--text-4)] shrink-0">{formatRelative(p.created_at)}</span>
                </div>
                {p.clients?.name && (
                  <p className="text-[10px] text-[var(--text-3)] mt-1 truncate">{p.clients.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visor derecha */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                  <div className="mt-1.5"><StatusBadge status={selected.status} /></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => copy(selected.content || selected.title)}>
                    <Copy size={12} /> Copiar
                  </Button>
                  <div className="relative">
                    <Button size="sm" variant="secondary" onClick={() => setStatusOpen(o => !o)}>
                      <Pencil size={12} /> Estado <ChevronDown size={11} />
                    </Button>
                    {statusOpen && (
                      <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl min-w-[130px]"
                        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                        {STATUS_ACTIONS.map(s => (
                          <button key={s} onClick={() => changeStatus(selected.id, s)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-2)] hover:bg-white/[.04] hover:text-white transition-colors">
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="danger" onClick={() => deleteProposal(selected.id)}>
                    <Trash2 size={12} /> Eliminar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {selected.clients?.name && (
                  <div className="rounded-xl p-3" style={CARD}>
                    <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest mb-1">Cliente</p>
                    <p className="text-sm text-white font-medium">{selected.clients.name}</p>
                    {selected.clients.industry && <p className="text-[10px] text-[var(--text-3)] mt-0.5">{selected.clients.industry}</p>}
                  </div>
                )}
                {selected.service && (
                  <div className="rounded-xl p-3" style={CARD}>
                    <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest mb-1">Servicio</p>
                    <p className="text-sm text-white font-medium">{selected.service}</p>
                  </div>
                )}
                {selected.amount && (
                  <div className="rounded-xl p-3" style={CARD}>
                    <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest mb-1">Monto</p>
                    <p className="text-sm text-white font-medium">${Number(selected.amount).toLocaleString('es-AR')}</p>
                  </div>
                )}
              </div>

              {selected.content ? (
                <div className="rounded-xl p-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap font-sans leading-relaxed">{selected.content}</p>
                </div>
              ) : (
                <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                  <p className="text-sm text-[var(--text-4)]">Esta propuesta no tiene contenido todavía.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileSignature size={40} className="text-[var(--text-4)]" />
              <p className="text-sm text-[var(--text-4)]">Seleccioná una propuesta</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM) }} title="Nueva propuesta" size="lg">
        <div className="space-y-4">
          <Select label="Cliente" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Servicio" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="Marketing digital + SEO" />
          <Input label="Monto estimado (opcional)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} type="number" placeholder="150000" />

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs text-[var(--text-3)] mb-3">
              Generá la propuesta automáticamente con IA, o completá el título y contenido de forma manual.
            </p>
            <div className="flex gap-3">
              <Button onClick={generateProposal} disabled={generating || !form.client_id || !form.service}>
                {generating
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generando...</>
                  : <><Sparkles size={13} /> Generar con IA</>
                }
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            </div>
          </div>

          <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest">Creación manual</p>
            <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Propuesta SEO — Empresa XYZ" />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={createManual} disabled={saving || !form.title}>
                {saving ? 'Guardando...' : 'Crear manual'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
