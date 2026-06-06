'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState, useMemo } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, formatNumber } from '@/lib/utils'
import {
  Plus, DollarSign, Clock, AlertTriangle, TrendingUp, CheckCircle2,
  CreditCard, ChevronLeft, ChevronRight, Calendar, Split, FileText,
  Trash2, Pencil, BadgeDollarSign,
} from 'lucide-react'

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

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const EMPTY = {
  client_id: '', project_id: '', amount: '', status: 'pending',
  description: '', due_date: '', paid_at: '',
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode
  color: 'orange' | 'green' | 'blue' | 'red' | 'purple'
}) {
  const colors = {
    orange: 'text-[#ff8c42] bg-[#ff8c42]/10 border-[#ff8c42]/20',
    green:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    blue:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    red:    'text-red-400 bg-red-400/10 border-red-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }
  return (
    <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[11px] text-[#334155] mt-1">{sub}</p>}
    </div>
  )
}

export default function InvoicesPage() {
  usePageTitle('Facturación')
  const [invoices, setInvoices]   = useState<Invoice[]>([])
  const [stats, setStats]         = useState<Stats>({ paid: 0, cobrado: 0, pending: 0, overdue: 0, mrr: 0 })
  const [clients, setClients]     = useState<Client[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSplit, setShowSplit] = useState(false)
  const [showAllMonths, setShowAllMonths] = useState(false)

  // Month navigator
  const now = new Date()
  const [selYear, setSelYear]   = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())

  // Pagos parciales
  const [paymentInvoice, setPaymentInvoice]     = useState<Invoice | null>(null)
  const [payments, setPayments]                 = useState<Payment[]>([])
  const [paymentTotalPaid, setPaymentTotalPaid] = useState(0)
  const [paymentAmount, setPaymentAmount]       = useState('')
  const [paymentDate, setPaymentDate]           = useState(new Date().toISOString().split('T')[0])
  const [paymentNote, setPaymentNote]           = useState('')
  const [paymentLoading, setPaymentLoading]     = useState(false)
  const [paymentSaving, setPaymentSaving]       = useState(false)

  // Cuotas
  const [useCuotas, setUseCuotas]     = useState(false)
  const [cuotasCount, setCuotasCount] = useState(2)
  const [cuotasDays, setCuotasDays]   = useState(30)

  async function load() {
    setLoading(true)
    const [iRes, cRes, pRes] = await Promise.all([
      fetch('/api/invoices'),
      fetch('/api/clients'),
      fetch('/api/projects'),
    ])
    const [iData, cData, pData] = await Promise.all([iRes.json(), cRes.json(), pRes.json()])
    const invoiceList: Invoice[] = iData.invoices || []

    try {
      const sumRes  = await fetch('/api/invoices/payments-summary')
      const sumData = await sumRes.json()
      const sums: Record<string, number> = sumData.sums || {}
      invoiceList.forEach(inv => { inv.paid_amount = sums[inv.id] || 0 })
    } catch { /* non-critical */ }

    setInvoices(invoiceList)
    setStats(iData.stats || { paid: 0, cobrado: 0, pending: 0, overdue: 0, mrr: 0 })
    setClients(cData.clients || [])
    setProjects(pData.projects || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Month navigation
  function prevMonth() {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1) }
    else setSelMonth(m => m - 1)
  }
  function nextMonth() {
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1) }
    else setSelMonth(m => m + 1)
  }

  // Invoices del mes seleccionado (por due_date, si no por created_at)
  const monthInvoices = useMemo(() => invoices.filter(inv => {
    const raw = inv.due_date || inv.created_at
    const d   = new Date(raw)
    return d.getFullYear() === selYear && d.getMonth() === selMonth
  }), [invoices, selYear, selMonth])

  // Stats del mes
  const monthStats = useMemo(() => {
    const cobrado   = monthInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
                    + monthInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.paid_amount || 0), 0)
    const pendiente = monthInvoices.filter(i => ['pending', 'partial'].includes(i.status))
                      .reduce((s, i) => s + Math.max(0, Number(i.amount) - (i.paid_amount || 0)), 0)
    const vencido   = monthInvoices.filter(i => i.status === 'overdue')
                      .reduce((s, i) => s + Number(i.amount), 0)
    const total     = monthInvoices.reduce((s, i) => s + Number(i.amount), 0)
    return { cobrado, pendiente, vencido, total, count: monthInvoices.length }
  }, [monthInvoices])

  // Lista filtrada para mostrar
  const displayInvoices = useMemo(() => {
    const base = showAllMonths ? invoices : monthInvoices
    if (!statusFilter) return base
    if (statusFilter === 'partial') return base.filter(i => (i.paid_amount || 0) > 0 && i.status !== 'paid')
    return base.filter(i => i.status === statusFilter)
  }, [invoices, monthInvoices, showAllMonths, statusFilter])

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
    } finally { setPaymentLoading(false) }
  }

  async function registerPayment() {
    if (!paymentInvoice || !paymentAmount) return
    setPaymentSaving(true)
    try {
      const res = await fetch(`/api/invoices/${paymentInvoice.id}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), paid_at: paymentDate, note: paymentNote || null }),
      })
      const data = await res.json()
      setPayments(prev => [{
        id: data.payment?.id || '', invoice_id: paymentInvoice.id,
        amount: parseFloat(paymentAmount), paid_at: paymentDate,
        note: paymentNote || null, created_at: new Date().toISOString(),
      }, ...prev])
      setPaymentTotalPaid(data.total_paid)
      setPaymentAmount('')
      setPaymentNote('')
      if (data.new_status === 'paid') setPaymentInvoice(null)
      load()
    } finally { setPaymentSaving(false) }
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
      due_date:    inv.due_date  ? inv.due_date.split('T')[0]  : '',
      paid_at:     inv.paid_at   ? inv.paid_at.split('T')[0]   : '',
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
      project_id:  projectId,
      amount:      project?.budget ? String(project.budget) : f.amount,
      description: f.description || (project ? `Proyecto: ${project.name}` : ''),
    }))
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      if (editInvoice) {
        const body: Record<string, unknown> = {
          amount:      parseFloat(form.amount),
          status:      form.status,
          description: form.description || null,
          due_date:    form.due_date    || null,
          project_id:  form.project_id  || null,
        }
        if (form.paid_at) body.paid_at = form.paid_at
        const res = await fetch(`/api/invoices/${editInvoice.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const b = await res.json(); setSaveError(b.error || 'Error'); setSaving(false); return }
      } else if (useCuotas && form.amount) {
        const total     = parseFloat(form.amount)
        const cuotaAmt  = Math.floor(total / cuotasCount)
        const lastAmt   = total - cuotaAmt * (cuotasCount - 1)
        const baseDate  = form.due_date ? new Date(form.due_date) : new Date()
        for (let i = 0; i < cuotasCount; i++) {
          const d = new Date(baseDate)
          d.setDate(d.getDate() + i * cuotasDays)
          const res = await fetch('/api/invoices', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              amount:      i === cuotasCount - 1 ? lastAmt : cuotaAmt,
              description: `${form.description || 'Servicio'} — Cuota ${i + 1}/${cuotasCount}`,
              due_date:    d.toISOString().split('T')[0],
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
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    load()
  }

  async function deleteInvoice(id: string) {
    if (!confirm('¿Eliminar esta factura?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    load()
  }

  const remaining = paymentInvoice ? Math.max(0, Number(paymentInvoice.amount) - paymentTotalPaid) : 0

  // ─── Progress del mes ─────────────────────────────────────────────
  const monthPct = monthStats.total > 0 ? Math.round((monthStats.cobrado / monthStats.total) * 100) : 0

  return (
    <>
      <Header
        title="Facturación"
        subtitle="Revenue tracking"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSplit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#ff8c42]/10 hover:bg-[#ff8c42]/20 text-[#ff8c42] border border-[#ff8c42]/30 hover:border-[#ff8c42]/50 rounded-lg transition-colors"
            >
              <Split size={12}/> Split 50/50
            </button>
            <Button onClick={openNew} size="sm"><Plus size={13}/> Nueva factura</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-grid">

        {/* ── Stats globales ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total cobrado"
            value={`$${formatNumber(stats.cobrado ?? stats.paid)}`}
            sub="incluye pagos parciales"
            icon={<CheckCircle2 size={15}/>}
            color="green"
          />
          <StatCard
            label="Por cobrar"
            value={`$${formatNumber(stats.pending)}`}
            sub="facturas pendientes"
            icon={<Clock size={15}/>}
            color="blue"
          />
          <StatCard
            label="Vencido"
            value={`$${formatNumber(stats.overdue)}`}
            sub="requiere atención"
            icon={<AlertTriangle size={15}/>}
            color="red"
          />
          <StatCard
            label="MRR (30 días)"
            value={`$${formatNumber(stats.mrr)}`}
            sub="cobrado este mes"
            icon={<TrendingUp size={15}/>}
            color="orange"
          />
        </div>

        {/* ── Navegador de mes ── */}
        <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
          {/* Header del mes */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2f4a]">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl bg-[#1a2d45] hover:bg-[#253f60] text-[#64748b] hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16}/>
            </button>

            <div className="text-center">
              <h2 className="text-xl font-black text-white">{MONTHS_ES[selMonth]} {selYear}</h2>
              <p className="text-[11px] text-[#475569] mt-0.5">
                {monthStats.count} {monthStats.count === 1 ? 'factura' : 'facturas'} · ${formatNumber(monthStats.total)} total
              </p>
            </div>

            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl bg-[#1a2d45] hover:bg-[#253f60] text-[#64748b] hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight size={16}/>
            </button>
          </div>

          {/* Stats del mes */}
          <div className="grid grid-cols-3 divide-x divide-[#1e2f4a]">
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-1.5">Cobrado</p>
              <p className="text-xl font-black text-emerald-400">${formatNumber(monthStats.cobrado)}</p>
              {monthStats.total > 0 && (
                <p className="text-[11px] text-[#334155] mt-0.5">{monthPct}% del total</p>
              )}
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-1.5">Pendiente</p>
              <p className="text-xl font-black text-amber-400">${formatNumber(monthStats.pendiente)}</p>
              <p className="text-[11px] text-[#334155] mt-0.5">por cobrar</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-1.5">Proyección</p>
              <p className="text-xl font-black text-white">${formatNumber(monthStats.cobrado + monthStats.pendiente)}</p>
              <p className="text-[11px] text-[#334155] mt-0.5">si cobrás todo</p>
            </div>
          </div>

          {/* Barra de progreso del mes */}
          {monthStats.total > 0 && (
            <div className="px-6 pb-4">
              <div className="h-2 rounded-full bg-[#1a2d45] overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(monthStats.cobrado / monthStats.total) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${(monthStats.pendiente / monthStats.total) * 100}%` }}
                />
                <div
                  className="h-full bg-red-400 transition-all duration-500"
                  style={{ width: `${(monthStats.vencido / monthStats.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-[#475569]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Cobrado</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Pendiente</span>
                {monthStats.vencido > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Vencido</span>}
              </div>
            </div>
          )}

          {monthStats.count === 0 && !loading && (
            <div className="px-6 pb-4 text-center text-sm text-[#334155]">Sin facturas este mes</div>
          )}
        </div>

        {/* ── Lista de facturas ── */}
        <div className="space-y-3">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40"
              >
                <option value="">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="partial">Pago parcial</option>
                <option value="paid">Pagadas</option>
                <option value="overdue">Vencidas</option>
                <option value="draft">Borrador</option>
                <option value="canceled">Canceladas</option>
              </select>
            </div>
            <button
              onClick={() => setShowAllMonths(v => !v)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                showAllMonths
                  ? 'bg-[#ff8c42]/10 border-[#ff8c42]/30 text-[#ff8c42]'
                  : 'bg-[#0e1a2e] border-[#1e2f4a] text-[#475569] hover:text-white'
              }`}
            >
              {showAllMonths ? `Mostrando todo · filtrar por mes` : `Ver todas las facturas`}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : displayInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
                <DollarSign size={24} className="text-[#1e2f4a]"/>
              </div>
              <p className="text-sm text-[#475569]">
                {showAllMonths ? 'No hay facturas' : `No hay facturas en ${MONTHS_ES[selMonth]}`}
              </p>
              <Button onClick={openNew} size="sm">Crear factura</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayInvoices.map(inv => {
                const paidAmt    = inv.paid_amount || 0
                const rest       = Math.max(0, Number(inv.amount) - paidAmt)
                const hasPartial = paidAmt > 0 && inv.status !== 'paid'
                const pct        = Number(inv.amount) > 0 ? Math.min(100, Math.round((paidAmt / Number(inv.amount)) * 100)) : 0

                return (
                  <div
                    key={inv.id}
                    className="bg-[#0e1a2e] border border-[#1e2f4a] hover:border-[#253f60] rounded-2xl p-5 transition-colors"
                  >
                    {/* Fila superior */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[11px] font-mono text-[#334155]">{inv.invoice_number}</span>
                          <StatusBadge status={inv.status}/>
                          {inv.due_date && (
                            <span className="flex items-center gap-1 text-[11px] text-[#475569]">
                              <Calendar size={10}/>{formatDate(inv.due_date).split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-black text-white truncate">{inv.clients?.name || '—'}</p>
                        {inv.projects?.name && (
                          <p className="text-[12px] text-[#475569] mt-0.5">{inv.projects.name}</p>
                        )}
                        {inv.description && (
                          <p className="text-sm text-[#64748b] mt-1.5 line-clamp-2">{inv.description}</p>
                        )}
                      </div>

                      {/* Monto + resta */}
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-white">${Number(inv.amount).toLocaleString()}</p>
                        {inv.status === 'paid' && (
                          <p className="text-[12px] text-emerald-400 font-semibold mt-0.5">✓ Pagado</p>
                        )}
                        {hasPartial && (
                          <div className="mt-0.5">
                            <p className="text-[11px] text-emerald-400">${paidAmt.toLocaleString()} pagado</p>
                            <p className="text-base font-black text-amber-400">Resta ${rest.toLocaleString()}</p>
                          </div>
                        )}
                        {inv.status === 'overdue' && (
                          <p className="text-[12px] text-red-400 font-semibold mt-0.5">Vencida</p>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso (pagos parciales) */}
                    {hasPartial && (
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-[#475569] mb-1.5">
                          <span>Progreso de cobro</span>
                          <span className="font-bold text-amber-400">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#1a2d45] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 flex-wrap pt-3 border-t border-[#1e2f4a]">
                      <button
                        onClick={() => window.open(`/invoice-print/${inv.id}`, '_blank')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a2d45] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors"
                      >
                        <FileText size={11}/> PDF
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a2d45] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors"
                      >
                        <Pencil size={11}/> Editar
                      </button>
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-lg transition-colors"
                          >
                            <CreditCard size={11}/> Registrar pago
                          </button>
                          <button
                            onClick={() => markPaid(inv.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={11}/> Cobrado total
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Nueva / Editar Factura ── */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}
        title={editInvoice ? `Editar ${editInvoice.invoice_number}` : 'Nueva factura'}
      >
        <div className="space-y-4">
          {/* Cliente (solo lectura al editar) */}
          {editInvoice ? (
            <div className="px-4 py-3 bg-[#080f1e] border border-[#1a2d45] rounded-xl">
              <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-0.5">Cliente</p>
              <p className="text-sm font-semibold text-white">{editInvoice.clients?.name || '—'}</p>
            </div>
          ) : (
            <Select label="Cliente *" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}

          <Select
            label="Proyecto (opcional)"
            value={form.project_id}
            onChange={e => editInvoice ? setForm(f => ({ ...f, project_id: e.target.value })) : handleProjectSelect(e.target.value)}
          >
            <option value="">Sin proyecto</option>
            {(editInvoice ? projects : projectsForClient).map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.budget ? ` — $${Number(p.budget).toLocaleString()}` : ''}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monto (ARS) *"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              type="number"
              placeholder="500000"
            />
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="canceled">Cancelada</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de vencimiento"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              type="date"
            />
            {form.status === 'paid' && (
              <Input
                label="Fecha de pago"
                value={form.paid_at}
                onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))}
                type="date"
              />
            )}
          </div>

          <Textarea
            label="Descripción"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Servicios de marketing digital — Junio 2026"
          />

          {/* Cuotas (solo en nueva) */}
          {!editInvoice && (
            <div className="rounded-xl border border-[#1e2f4a] p-4 bg-[#0a1525] space-y-3">
              <button type="button" onClick={() => setUseCuotas(v => !v)} className="flex items-center gap-2.5 w-full text-left">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useCuotas ? 'bg-[#ff8c42] border-[#ff8c42]' : 'border-[#334155] bg-[#0e1a2e]'}`}>
                  {useCuotas && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Dividir en cuotas</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">Genera facturas separadas por cuota</p>
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
                  <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] text-[#334155] uppercase tracking-widest mb-2">Preview</p>
                    {Array.from({ length: cuotasCount }, (_, i) => {
                      const total    = parseFloat(form.amount)
                      const cAmt     = Math.floor(total / cuotasCount)
                      const lastAmt  = total - cAmt * (cuotasCount - 1)
                      const base     = form.due_date ? new Date(form.due_date) : new Date()
                      const due      = new Date(base)
                      due.setDate(due.getDate() + i * cuotasDays)
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-[#475569]">Cuota {i + 1}/{cuotasCount}</span>
                          <span className="font-bold text-[#ff8c42]">${(i === cuotasCount - 1 ? lastAmt : cAmt).toLocaleString()}</span>
                          <span className="text-[#334155]">{due.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={save}
              disabled={saving || (!editInvoice && (!form.client_id || !form.amount)) || (!!editInvoice && !form.amount)}
            >
              {saving ? 'Guardando...' : editInvoice ? 'Guardar cambios' : useCuotas ? `Crear ${cuotasCount} cuotas` : 'Crear factura'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}>
              Cancelar
            </Button>
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
            {/* Resumen */}
            <div className="bg-[#080f1e] border border-[#1a2d45] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-white">{paymentInvoice.clients?.name}</p>
                  {paymentInvoice.description && (
                    <p className="text-[12px] text-[#475569] mt-0.5">{paymentInvoice.description}</p>
                  )}
                </div>
                <StatusBadge status={
                  paymentLoading ? paymentInvoice.status
                    : paymentTotalPaid >= Number(paymentInvoice.amount) ? 'paid'
                    : paymentTotalPaid > 0 ? 'partial'
                    : paymentInvoice.status
                }/>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-[#0e1a2e] border border-[#1e2f4a]">
                  <p className="text-[10px] text-[#475569] uppercase tracking-wide mb-1">Total</p>
                  <p className="text-sm font-black text-white">${Number(paymentInvoice.amount).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-wide mb-1">Pagado</p>
                  <p className="text-sm font-black text-emerald-400">${paymentTotalPaid.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
                  <p className="text-[10px] text-amber-400/60 uppercase tracking-wide mb-1">Resta</p>
                  <p className="text-sm font-black text-amber-400">${remaining.toLocaleString()}</p>
                </div>
              </div>

              {paymentTotalPaid > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-[#475569] mb-1.5">
                    <span>Progreso de cobro</span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((paymentTotalPaid / Number(paymentInvoice.amount)) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1a2d45] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (paymentTotalPaid / Number(paymentInvoice.amount)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Historial */}
            {paymentLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : payments.length > 0 && (
              <div>
                <p className="text-[10px] text-[#334155] uppercase tracking-widest mb-2">Historial de pagos</p>
                <div className="space-y-2">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#080f1e] border border-[#1a2d45] rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <BadgeDollarSign size={13} className="text-emerald-400"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-emerald-400">${Number(p.amount).toLocaleString()}</p>
                        {p.note && <p className="text-[11px] text-[#475569] truncate">{p.note}</p>}
                      </div>
                      <p className="text-[11px] text-[#334155] shrink-0">
                        {new Date(p.paid_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nuevo pago */}
            {remaining > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#1e2f4a]">
                <p className="text-[10px] text-[#334155] uppercase tracking-widest">Registrar pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Monto *"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    type="number"
                    placeholder={remaining.toLocaleString()}
                  />
                  <Input
                    label="Fecha"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    type="date"
                  />
                </div>
                {/* Atajos */}
                <div className="flex gap-2 flex-wrap">
                  {[remaining, Math.floor(remaining / 2), Math.floor(Number(paymentInvoice.amount) / 2)]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaymentAmount(String(val))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#0e1a2e] border border-[#1e2f4a] text-[#475569] hover:text-[#ff8c42] hover:border-[#ff8c42]/30 transition-colors"
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))
                  }
                </div>
                <Input
                  label="Nota (opcional)"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Transferencia, efectivo..."
                />
                <Button
                  onClick={registerPayment}
                  disabled={paymentSaving || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full"
                >
                  {paymentSaving
                    ? 'Registrando...'
                    : `Registrar $${parseFloat(paymentAmount || '0').toLocaleString() || '---'}`
                  }
                </Button>
              </div>
            )}
            {remaining <= 0 && (
              <p className="text-center text-sm text-emerald-400 font-bold py-2">✓ Factura completamente pagada</p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal Split 50/50 ── */}
      <Modal open={showSplit} onClose={() => setShowSplit(false)} title="Split 50/50 — Facundo & Mauricio">
        <div className="space-y-4">
          <p className="text-xs text-[#4a6080]">División equitativa del revenue</p>
          {[
            { label: 'Cobrado',        sub: 'incl. parciales',    value: stats.cobrado ?? stats.paid, color: '#22c55e' as const },
            { label: 'Por cobrar',     sub: 'facturas pendientes', value: stats.pending,              color: '#60a5fa' as const },
            { label: 'Vencido',        sub: 'facturas vencidas',   value: stats.overdue,              color: '#f87171' as const },
            { label: 'Total potencial',sub: 'si cobrás todo',      value: (stats.cobrado ?? stats.paid) + stats.pending + stats.overdue, color: '#ff8c42' as const, bold: true },
          ].map(row => (
            <div
              key={row.label}
              className={`rounded-xl border p-4 ${row.bold ? 'border-[#ff8c42]/30 bg-[#ff8c42]/5' : 'border-[#1a2d45] bg-[#080f1e]'}`}
            >
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-3">{row.label} · {row.sub}</p>
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
          <button onClick={() => setShowSplit(false)} className="w-full text-xs text-[#4a6080] hover:text-white transition-colors py-1">
            Cerrar
          </button>
        </div>
      </Modal>
    </>
  )
}
