'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/Card'
import { formatDate, formatNumber } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, DollarSign, Clock, AlertTriangle, TrendingUp, CheckCircle2, Split, CreditCard } from 'lucide-react'

interface Payment {
  id: string; invoice_id: string; amount: number; paid_at: string; note: string | null; created_at: string
}
interface Invoice {
  id: string; invoice_number: string; amount: number; status: string
  description: string | null; due_date: string | null; paid_at: string | null
  created_at: string
  clients: { name: string; email: string | null } | null
  projects: { id: string; name: string; budget: number | null } | null
  paid_amount?: number
}
interface Stats { paid: number; cobrado: number; pending: number; overdue: number; mrr: number }
interface Client { id: string; name: string }
interface Project { id: string; name: string; budget: number | null; client_id: string }

const EMPTY = { client_id: '', project_id: '', amount: '', status: 'pending', description: '', due_date: '' }

export default function InvoicesPage() {
  usePageTitle('Facturas')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats]       = useState<Stats>({ paid: 0, cobrado: 0, pending: 0, overdue: 0, mrr: 0 })
  const [clients, setClients]   = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSplit, setShowSplit] = useState(false)

  // Pagos parciales
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments]             = useState<Payment[]>([])
  const [paymentTotalPaid, setPaymentTotalPaid] = useState(0)
  const [paymentAmount, setPaymentAmount]   = useState('')
  const [paymentDate, setPaymentDate]       = useState(new Date().toISOString().split('T')[0])
  const [paymentNote, setPaymentNote]       = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSaving, setPaymentSaving]   = useState(false)

  // Cuotas (al crear factura nueva)
  const [useCuotas, setUseCuotas]     = useState(false)
  const [cuotasCount, setCuotasCount] = useState(2)
  const [cuotasDays, setCuotasDays]   = useState(30)

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    const [iRes, cRes, pRes] = await Promise.all([
      fetch(`/api/invoices?${p}`),
      fetch('/api/clients'),
      fetch('/api/projects'),
    ])
    const [iData, cData, pData] = await Promise.all([iRes.json(), cRes.json(), pRes.json()])
    const invoiceList: Invoice[] = iData.invoices || []

    // Cargar sumas de pagos para todas las facturas de una vez
    try {
      const paymentsRes  = await fetch('/api/invoices/payments-summary')
      const paymentsData = await paymentsRes.json()
      const sums: Record<string, number> = paymentsData.sums || {}
      invoiceList.forEach(inv => { inv.paid_amount = sums[inv.id] || 0 })
    } catch { /* no critical */ }

    setInvoices(invoiceList)
    setStats(iData.stats || { paid: 0, pending: 0, overdue: 0, mrr: 0 })
    setClients(cData.clients || [])
    setProjects(pData.projects || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function openPaymentModal(inv: Invoice) {
    setPaymentInvoice(inv)
    setPaymentAmount('')
    setPaymentNote('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentLoading(true)
    try {
      const res  = await fetch(`/api/invoices/${inv.id}/payments`)
      const data = await res.json()
      setPayments(data.payments || [])
      setPaymentTotalPaid(data.total_paid || 0)
    } finally {
      setPaymentLoading(false)
    }
  }

  async function registerPayment() {
    if (!paymentInvoice || !paymentAmount) return
    setPaymentSaving(true)
    try {
      const res = await fetch(`/api/invoices/${paymentInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), paid_at: paymentDate, note: paymentNote || null }),
      })
      const data = await res.json()
      setPayments(prev => [{
        id: data.payment?.id || '', invoice_id: paymentInvoice.id, amount: parseFloat(paymentAmount),
        paid_at: paymentDate, note: paymentNote || null, created_at: new Date().toISOString(),
      }, ...prev])
      setPaymentTotalPaid(data.total_paid)
      setPaymentAmount('')
      setPaymentNote('')
      // Si quedó pagada, cerrar modal y recargar
      if (data.new_status === 'paid') {
        setPaymentInvoice(null)
      }
      load()
    } finally {
      setPaymentSaving(false)
    }
  }

  function openEdit(inv: Invoice) {
    setEditInvoice(inv)
    setUseCuotas(false)
    setForm({
      client_id:   '',
      project_id:  inv.projects?.id || '',
      amount:      String(inv.amount),
      status:      inv.status,
      description: inv.description || '',
      due_date:    inv.due_date ? inv.due_date.split('T')[0] : '',
    })
    setShowModal(true)
  }

  function openNew() {
    setEditInvoice(null)
    setUseCuotas(false)
    setCuotasCount(2)
    setCuotasDays(30)
    setForm(EMPTY)
    setShowModal(true)
  }

  const projectsForClient = form.client_id
    ? projects.filter(p => p.client_id === form.client_id)
    : projects

  function handleProjectSelect(projectId: string) {
    const project = projects.find(p => p.id === projectId)
    setForm(f => ({
      ...f,
      project_id: projectId,
      amount: project?.budget ? String(project.budget) : f.amount,
      description: f.description || (project ? `Proyecto: ${project.name}` : ''),
    }))
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      if (editInvoice) {
        const res = await fetch(`/api/invoices/${editInvoice.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount:      parseFloat(form.amount),
            status:      form.status,
            description: form.description || null,
            due_date:    form.due_date || null,
            project_id:  form.project_id || null,
          }),
        })
        if (!res.ok) { const b = await res.json(); setSaveError(b.error || 'Error'); setSaving(false); return }
      } else if (useCuotas && form.amount) {
        // Crear N cuotas como facturas separadas
        const totalAmount  = parseFloat(form.amount)
        const cuotaAmount  = Math.floor(totalAmount / cuotasCount)
        const lastCuota    = totalAmount - cuotaAmount * (cuotasCount - 1)
        const baseDate     = form.due_date ? new Date(form.due_date) : new Date()

        for (let i = 0; i < cuotasCount; i++) {
          const dueDate = new Date(baseDate)
          dueDate.setDate(dueDate.getDate() + i * cuotasDays)
          const isLast = i === cuotasCount - 1
          const res = await fetch('/api/invoices', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              amount:      isLast ? lastCuota : cuotaAmount,
              description: `${form.description || 'Servicio'} — Cuota ${i + 1}/${cuotasCount}`,
              due_date:    dueDate.toISOString().split('T')[0],
              project_id:  form.project_id || null,
            }),
          })
          if (!res.ok) { const b = await res.json(); setSaveError(b.error || 'Error'); setSaving(false); return }
        }
      } else {
        const res = await fetch('/api/invoices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            amount:     parseFloat(form.amount),
            due_date:   form.due_date   || null,
            project_id: form.project_id || null,
          }),
        })
        if (!res.ok) { const b = await res.json(); setSaveError(b.error || 'Error'); setSaving(false); return }
      }
      setShowModal(false); setEditInvoice(null); setForm(EMPTY); setUseCuotas(false); load()
    } catch { setSaveError('Error de red') }
    finally { setSaving(false) }
  }

  async function markPaid(id: string) {
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paid' }) })
    load()
  }

  async function deleteInvoice(id: string) {
    if (!confirm('¿Eliminar factura?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    load()
  }

  const chartData = (() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('es', { month: 'short' })
      months[key] = 0
    }
    invoices.filter(i => i.status === 'paid' && i.paid_at).forEach(i => {
      const d   = new Date(i.paid_at!)
      const key = d.toLocaleString('es', { month: 'short' })
      if (key in months) months[key] += Number(i.amount)
    })
    return Object.entries(months).map(([month, total]) => ({ month, total }))
  })()

  const remaining = paymentInvoice ? Math.max(0, Number(paymentInvoice.amount) - paymentTotalPaid) : 0

  return (
    <>
      <Header
        title="Facturación"
        subtitle="Revenue tracking"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowSplit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 hover:border-[#f97316]/50 rounded-lg transition-colors">
              <Split size={12}/> ¿Cuánto nos toca?
            </button>
            <Button onClick={openNew} size="sm"><Plus size={13}/> Nueva factura</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-grid">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="MRR (30 días)" value={`$${formatNumber(stats.mrr)}`} icon={<TrendingUp size={16}/>} color="orange" sub="facturado este mes" />
          <StatCard label="Total cobrado"  value={`$${formatNumber(stats.cobrado ?? stats.paid)}`} icon={<CheckCircle2 size={16}/>} color="green"  sub="incl. pagos parciales" />
          <StatCard label="Por cobrar"     value={`$${formatNumber(stats.pending)}`} icon={<Clock size={16}/>}        color="blue"   sub="pendiente" />
          <StatCard label="Vencido"        value={`$${formatNumber(stats.overdue)}`} icon={<AlertTriangle size={16}/>} color="purple" sub="overdue" />
        </div>

        {/* Proyección */}
        {(stats.pending > 0 || stats.overdue > 0) && (
          <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Proyección — si cobrás todo lo pendiente</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-black text-white">${formatNumber((stats.cobrado ?? stats.paid) + stats.pending + stats.overdue)}</span>
              <span className="text-xs text-[#4a6080]">total potencial</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a2d45] overflow-hidden flex">
              {(() => { const c = stats.cobrado ?? stats.paid; const total = c + stats.pending + stats.overdue; return total > 0 ? <>
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(c/total*100)}%` }}/>
                <div className="h-full bg-blue-400 transition-all"    style={{ width: `${Math.round(stats.pending/total*100)}%` }}/>
                <div className="h-full bg-red-400 transition-all"     style={{ width: `${Math.round(stats.overdue/total*100)}%` }}/>
              </> : null })()}
            </div>
            <div className="flex gap-4 mt-2 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Cobrado ${formatNumber(stats.cobrado ?? stats.paid)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Pendiente ${formatNumber(stats.pending)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Vencido ${formatNumber(stats.overdue)}</span>
            </div>
          </div>
        )}

        {/* Gráfico */}
        <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-5">Revenue cobrado — últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${formatNumber(v)}`} />
              <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid #1e2f4a', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Cobrado']} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? '#ff8c42' : '#1e2f4a'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40">
              <option value="">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="partial">Pago parcial</option>
              <option value="paid">Pagadas</option>
              <option value="overdue">Vencidas</option>
              <option value="draft">Borrador</option>
              <option value="canceled">Canceladas</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/></div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <DollarSign size={32} className="text-[#1e2f4a]"/>
              <p className="text-sm text-[#475569]">No hay facturas</p>
              <Button onClick={() => setShowModal(true)} size="sm">Crear primera factura</Button>
            </div>
          ) : (
            <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2f4a]">
                    {['#', 'Cliente', 'Proyecto', 'Descripción', 'Monto', 'Estado', 'Vence', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] text-[#334155] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const paidAmt = inv.paid_amount || 0
                    const hasPartial = paidAmt > 0 && inv.status !== 'paid'
                    const pct = hasPartial ? Math.min(100, Math.round((paidAmt / Number(inv.amount)) * 100)) : 0
                    return (
                      <tr key={inv.id} className="border-b border-[#1e2f4a]/40 hover:bg-white/[.015] transition-colors last:border-0">
                        <td className="px-5 py-3 text-xs font-mono text-[#475569]">{inv.invoice_number}</td>
                        <td className="px-5 py-3 text-sm text-white font-medium">{inv.clients?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-[#475569]">{inv.projects?.name || '—'}</td>
                        <td className="px-5 py-3 text-sm text-[#475569] max-w-xs truncate">{inv.description || '—'}</td>
                        <td className="px-5 py-3 min-w-[140px]">
                          <div>
                            <span className="text-sm font-bold text-white">${Number(inv.amount).toLocaleString()}</span>
                            {hasPartial && (
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] text-amber-400">${paidAmt.toLocaleString()} pagado</span>
                                  <span className="text-[10px] text-[#475569]">{pct}%</span>
                                </div>
                                <div className="h-1 rounded-full bg-[#1e2f4a] overflow-hidden">
                                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}/>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status}/></td>
                        <td className="px-5 py-3 text-xs text-[#475569]">{inv.due_date ? formatDate(inv.due_date).split(' ')[0] : '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => window.open(`/invoice-print/${inv.id}`, '_blank')}
                              className="text-xs px-2 py-1 bg-[#1e2f4a] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors">PDF</button>
                            <button onClick={() => openEdit(inv)}
                              className="text-xs px-2 py-1 bg-[#1e2f4a] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors">Editar</button>
                            {inv.status !== 'paid' && (
                              <>
                                <button onClick={() => openPaymentModal(inv)}
                                  className="text-xs px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-lg transition-colors flex items-center gap-1">
                                  <CreditCard size={10}/> Pago
                                </button>
                                <button onClick={() => markPaid(inv.id)}
                                  className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors">
                                  ✓ Total
                                </button>
                              </>
                            )}
                            <button onClick={() => deleteInvoice(inv.id)} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors">×</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Nueva/Editar Factura ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }} title={editInvoice ? `Editar factura ${editInvoice.invoice_number}` : 'Nueva factura'}>
        <div className="space-y-4">
          {editInvoice && (
            <div className="space-y-3">
              <div className="px-3 py-2 bg-[#0f1d30] border border-[#1a2d45] rounded-lg">
                <p className="text-xs text-[#64748b]">Cliente: <span className="text-white font-medium">{editInvoice.clients?.name || '—'}</span></p>
              </div>
              <Select label="Proyecto (opcional)" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">Sin proyecto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.budget ? ` — $${Number(p.budget).toLocaleString()}` : ''}</option>)}
              </Select>
            </div>
          )}
          {!editInvoice && (
            <>
              <Select label="Cliente *" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Proyecto (opcional)" value={form.project_id} onChange={e => handleProjectSelect(e.target.value)}>
                <option value="">Sin proyecto</option>
                {projectsForClient.map(p => <option key={p.id} value={p.id}>{p.name}{p.budget ? ` — $${Number(p.budget).toLocaleString()}` : ''}</option>)}
              </Select>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto total (ARS) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="500.000" />
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="canceled">Cancelada</option>
            </Select>
          </div>

          <Input label="Fecha de vencimiento (1ª cuota si dividís)" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} type="date" />
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Servicios de marketing digital — Marzo 2026" />

          {/* ── Opción de cuotas (solo en nueva factura) ── */}
          {!editInvoice && (
            <div className="space-y-3 rounded-xl border border-[#1e2f4a] p-4 bg-[#0a1525]">
              <button
                type="button"
                onClick={() => setUseCuotas(v => !v)}
                className="flex items-center gap-2.5 w-full text-left"
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useCuotas ? 'bg-[#ff8c42] border-[#ff8c42]' : 'border-[#334155] bg-[#0e1a2e]'}`}>
                  {useCuotas && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Dividir en cuotas</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">Crea facturas separadas, una por cuota</p>
                </div>
              </button>

              {useCuotas && form.amount && (
                <div className="space-y-3 pt-2 border-t border-[#1e2f4a]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-[#64748b] mb-1.5">Cantidad de cuotas</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[2, 3, 4, 6, 12].map(n => (
                          <button key={n} type="button" onClick={() => setCuotasCount(n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${cuotasCount === n ? 'bg-[#ff8c42]/15 border-[#ff8c42]/40 text-[#ff8c42]' : 'bg-[#0e1a2e] border-[#1e2f4a] text-[#475569] hover:text-white'}`}>
                            {n}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] mb-1.5">Días entre cuotas</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[7, 15, 30, 60].map(d => (
                          <button key={d} type="button" onClick={() => setCuotasDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${cuotasDays === d ? 'bg-[#ff8c42]/15 border-[#ff8c42]/40 text-[#ff8c42]' : 'bg-[#0e1a2e] border-[#1e2f4a] text-[#475569] hover:text-white'}`}>
                            {d === 30 ? '1 mes' : d === 60 ? '2 meses' : `${d}d`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Preview de cuotas */}
                  {form.amount && (
                    <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] text-[#334155] uppercase tracking-widest mb-2">Preview</p>
                      {Array.from({ length: cuotasCount }, (_, i) => {
                        const total     = parseFloat(form.amount)
                        const cuotaAmt  = Math.floor(total / cuotasCount)
                        const lastAmt   = total - cuotaAmt * (cuotasCount - 1)
                        const baseDate  = form.due_date ? new Date(form.due_date) : new Date()
                        const dueDate   = new Date(baseDate)
                        dueDate.setDate(dueDate.getDate() + i * cuotasDays)
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-[#475569]">Cuota {i + 1}/{cuotasCount}</span>
                            <span className="font-bold text-[#ff8c42]">${(i === cuotasCount - 1 ? lastAmt : cuotaAmt).toLocaleString()}</span>
                            <span className="text-[#334155]">{dueDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {saveError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>}
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || (!editInvoice && (!form.client_id || !form.amount)) || (!!editInvoice && !form.amount)}>
              {saving ? 'Guardando...' : editInvoice ? 'Guardar cambios' : useCuotas ? `Crear ${cuotasCount} cuotas` : 'Crear factura'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Registrar Pago Parcial ── */}
      <Modal
        open={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title={paymentInvoice ? `Pagos — ${paymentInvoice.invoice_number}` : ''}
      >
        {paymentInvoice && (
          <div className="space-y-5">
            {/* Resumen de la factura */}
            <div className="bg-[#0a1525] border border-[#1e2f4a] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{paymentInvoice.clients?.name}</span>
                <StatusBadge status={paymentLoading ? paymentInvoice.status : (paymentTotalPaid >= Number(paymentInvoice.amount) ? 'paid' : paymentTotalPaid > 0 ? 'partial' : paymentInvoice.status)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-[#0e1a2e]">
                  <p className="text-[10px] text-[#475569] uppercase tracking-wide mb-1">Total</p>
                  <p className="text-sm font-black text-white">${Number(paymentInvoice.amount).toLocaleString()}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#0e1a2e]">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-wide mb-1">Pagado</p>
                  <p className="text-sm font-black text-emerald-400">${paymentTotalPaid.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#0e1a2e]">
                  <p className="text-[10px] text-amber-400/60 uppercase tracking-wide mb-1">Resta</p>
                  <p className="text-sm font-black text-amber-400">${remaining.toLocaleString()}</p>
                </div>
              </div>
              {paymentTotalPaid > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-[#475569] mb-1.5">
                    <span>Progreso de pago</span>
                    <span>{Math.min(100, Math.round((paymentTotalPaid / Number(paymentInvoice.amount)) * 100))}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1e2f4a] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (paymentTotalPaid / Number(paymentInvoice.amount)) * 100)}%` }}/>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de pagos */}
            {paymentLoading ? (
              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/></div>
            ) : payments.length > 0 && (
              <div>
                <p className="text-[10px] text-[#334155] uppercase tracking-widest mb-2">Historial de pagos</p>
                <div className="space-y-2">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#0a1525] border border-[#1e2f4a] rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 text-xs font-bold">$</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-400">${Number(p.amount).toLocaleString()}</p>
                        {p.note && <p className="text-[11px] text-[#475569] truncate">{p.note}</p>}
                      </div>
                      <p className="text-[11px] text-[#334155] shrink-0">
                        {new Date(p.paid_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario nuevo pago */}
            {remaining > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#1e2f4a]">
                <p className="text-[10px] text-[#334155] uppercase tracking-widest">Registrar nuevo pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Monto recibido *"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    type="number"
                    placeholder={`${remaining.toLocaleString()}`}
                  />
                  <Input
                    label="Fecha"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    type="date"
                  />
                </div>
                {/* Atajos rápidos de monto */}
                <div className="flex gap-2 flex-wrap">
                  {[remaining, Math.floor(remaining / 2), Math.floor(Number(paymentInvoice.amount) / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(val => (
                    <button key={val} type="button" onClick={() => setPaymentAmount(String(val))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#0e1a2e] border border-[#1e2f4a] text-[#475569] hover:text-[#ff8c42] hover:border-[#ff8c42]/30 transition-colors">
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
                <Input
                  label="Nota (opcional)"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Ej: Transferencia, efectivo..."
                />
                <Button
                  onClick={registerPayment}
                  disabled={paymentSaving || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full"
                >
                  {paymentSaving ? 'Registrando...' : `Registrar $${parseFloat(paymentAmount || '0').toLocaleString() || '---'}`}
                </Button>
              </div>
            )}
            {remaining <= 0 && (
              <p className="text-center text-sm text-emerald-400 font-semibold py-2">✓ Factura completamente pagada</p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal ¿Cuánto nos toca? */}
      <Modal open={showSplit} onClose={() => setShowSplit(false)} title="¿Cuánto nos toca?">
        <div className="space-y-5">
          <p className="text-xs text-[#4a6080]">División 50/50 entre Facundo y Mauricio</p>
          {[
            { label: 'Ya cobrado', value: stats.cobrado ?? stats.paid, color: '#22c55e', sub: 'incl. parciales' },
            { label: 'Por cobrar', value: stats.pending, color: '#60a5fa', sub: 'facturas pendientes' },
            { label: 'Vencido',    value: stats.overdue, color: '#f87171', sub: 'facturas vencidas' },
            { label: 'Total potencial', value: stats.paid + stats.pending + stats.overdue, color: '#f97316', sub: 'si cobrás todo', bold: true },
          ].map(row => (
            <div key={row.label} className={`rounded-xl border p-4 ${row.bold ? 'border-[#f97316]/30 bg-[#f97316]/5' : 'border-[#1a2d45] bg-[#080f1e]'}`}>
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-2">{row.label} · {row.sub}</p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] text-[#475569] mb-0.5">Total</p>
                  <p className="text-lg font-black" style={{ color: row.color }}>${formatNumber(row.value)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#475569] mb-0.5">Cada uno</p>
                  <p className="text-2xl font-black" style={{ color: row.color }}>${formatNumber(row.value / 2)}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-1">
            <button onClick={() => setShowSplit(false)} className="text-xs text-[#4a6080] hover:text-white transition-colors">Cerrar</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
