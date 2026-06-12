'use client'
import { useEffect, useState, useCallback } from 'react'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatNumber } from '@/lib/utils'
import { Plus, Repeat, Zap, Trash2, Pencil, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export interface Retainer {
  id: string; client_id: string; project_id: string | null
  amount: number; description: string | null; day_of_month: number
  active: boolean; created_at: string
  clients: { name: string } | null
  projects: { name: string } | null
  invoiced_this_month: boolean
}

interface Client { id: string; name: string }

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const EMPTY = { client_id: '', amount: '', description: '', day_of_month: '5' }

export default function RecurringTab({ selMonth, selYear, clients, onGenerated, onTablesMissing }: {
  selMonth: number; selYear: number
  clients: Client[]
  onGenerated: () => void
  onTablesMissing: () => void
}) {
  const [retainers, setRetainers] = useState<Retainer[]>([])
  const [mrr, setMrr]             = useState(0)
  const [loading, setLoading]     = useState(true)
  const [missing, setMissing]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/recurring?month=${selMonth + 1}&year=${selYear}`)
      const data = await res.json()
      if (data.code === 'PGRST205') { setMissing(true); onTablesMissing() }
      else {
        setRetainers(data.retainers || [])
        setMrr(data.mrr || 0)
      }
    } finally { setLoading(false) }
  }, [selMonth, selYear, onTablesMissing])

  useEffect(() => { load() }, [load])

  async function generate() {
    setGenerating(true); setGenMsg(null)
    try {
      const res  = await fetch('/api/recurring/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selMonth + 1, year: selYear }),
      })
      const data = await res.json()
      if (data.created > 0) {
        setGenMsg(`✓ ${data.created} factura${data.created > 1 ? 's' : ''} generada${data.created > 1 ? 's' : ''}`)
        onGenerated()
      } else {
        setGenMsg('Todas las facturas del mes ya estaban generadas')
      }
      load()
      setTimeout(() => setGenMsg(null), 4000)
    } finally { setGenerating(false) }
  }

  function openNew() { setEditId(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(r: Retainer) {
    setEditId(r.id)
    setForm({ client_id: r.client_id, amount: String(r.amount), description: r.description || '', day_of_month: String(r.day_of_month) })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      const body = {
        client_id:    form.client_id,
        amount:       parseFloat(form.amount),
        description:  form.description || null,
        day_of_month: parseInt(form.day_of_month) || 5,
      }
      if (editId) {
        await fetch(`/api/recurring/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        await fetch('/api/recurring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      setShowModal(false); setForm(EMPTY); setEditId(null)
      load()
    } finally { setSaving(false) }
  }

  async function toggleActive(r: Retainer) {
    setRetainers(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))
    await fetch(`/api/recurring/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !r.active }) })
    load()
  }

  async function remove(r: Retainer) {
    if (!confirm(`¿Eliminar el retainer de ${r.clients?.name}? Las facturas ya generadas no se borran.`)) return
    setRetainers(prev => prev.filter(x => x.id !== r.id))
    await fetch(`/api/recurring/${r.id}`, { method: 'DELETE' })
    load()
  }

  if (missing) return null

  const pendingCount = retainers.filter(r => r.active && !r.invoiced_this_month).length

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header: MRR real + generar */}
      <div className="panel-neon p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', boxShadow: '0 0 16px rgba(52,211,153,0.15)' }}>
            <Repeat size={17} style={{ color: '#34d399' }}/>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>MRR real — retainers activos</p>
            <p className="text-[26px] font-bold neon-green leading-none mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              ${formatNumber(mrr)}<span className="text-[13px] font-normal" style={{ color: 'var(--text-3)' }}> /mes</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {genMsg && <p className="text-[12px] font-semibold text-emerald-400">{genMsg}</p>}
          <button
            onClick={generate}
            disabled={generating || retainers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40"
            style={pendingCount > 0
              ? { background: 'var(--amber)', color: '#000', boxShadow: '0 0 20px rgba(245,158,11,0.35)' }
              : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
            }
          >
            {generating ? <Loader2 size={13} className="animate-spin"/> : <Zap size={13}/>}
            {pendingCount > 0
              ? `Generar ${pendingCount} factura${pendingCount > 1 ? 's' : ''} de ${MONTHS_ES[selMonth]}`
              : `${MONTHS_ES[selMonth]} al día`}
          </button>
          <Button onClick={openNew} size="sm"><Plus size={13}/> Nuevo retainer</Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}/>
        </div>
      ) : retainers.length === 0 ? (
        <div className="panel-neon flex flex-col items-center justify-center py-16 gap-3">
          <Repeat size={24} style={{ color: 'var(--text-4)' }}/>
          <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Sin ingresos recurrentes todavía</p>
          <p className="text-[11px] max-w-sm text-center" style={{ color: 'var(--text-4)' }}>
            Cargá el fee mensual de cada cliente una sola vez. Después, cada mes generás todas las facturas con un click.
          </p>
          <Button onClick={openNew} size="sm">Crear el primero</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {retainers.map(r => (
            <div key={r.id}
              className="rounded-xl p-4 pl-5 relative overflow-hidden transition-all"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                opacity: r.active ? 1 : 0.55,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                style={{ background: r.active ? '#34d399' : '#555', boxShadow: r.active ? '0 0 6px rgba(52,211,153,0.7)' : 'none' }}/>

              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-white truncate">{r.clients?.name || '—'}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {r.description || 'Fee mensual'} · vence el día {r.day_of_month}
                  </p>
                </div>
                <p className="text-[19px] font-bold shrink-0 neon-green" style={{ fontFamily: 'var(--font-display)' }}>
                  ${Number(r.amount).toLocaleString('es-AR')}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                {r.invoiced_this_month ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 size={11}/> Facturada en {MONTHS_ES[selMonth]}
                  </span>
                ) : r.active ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                    <AlertCircle size={11}/> Sin facturar en {MONTHS_ES[selMonth]}
                  </span>
                ) : (
                  <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>Pausado</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleActive(r)}
                    className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                    title={r.active ? 'Pausar' : 'Activar'}
                    style={{ background: r.active ? '#34d399' : 'var(--surface-2)', boxShadow: r.active ? '0 0 8px rgba(52,211,153,0.5)' : 'none' }}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.active ? 'left-[18px]' : 'left-0.5'}`}/>
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg transition-colors text-[var(--text-3)] hover:text-white hover:bg-white/[.06]">
                    <Pencil size={12}/>
                  </button>
                  <button onClick={() => remove(r)} className="p-1.5 rounded-lg transition-colors text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Editar retainer' : 'Nuevo ingreso recurrente'}>
        <div className="space-y-4">
          <Select label="Cliente *" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} disabled={!!editId}>
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto mensual (ARS) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="300000"/>
            <div>
              <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-3)' }}>Día de vencimiento</p>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 5, 10, 15, 20].map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, day_of_month: String(d) }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                    style={form.day_of_month === String(d)
                      ? { background: 'var(--amber-dim)', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--amber)' }
                      : { background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Gestión de redes + ads"/>
          <p className="text-[11px] px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Cada mes vas a poder generar la factura de este retainer con un click desde esta pestaña. Nunca se duplican.
          </p>
          <div className="flex gap-3 pt-1">
            <Button onClick={save} disabled={saving || !form.client_id || !form.amount}>
              {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear retainer'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
