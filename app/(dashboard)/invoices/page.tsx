'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, formatNumber } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import {
  Plus, DollarSign, Clock, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2,
  CreditCard, ChevronLeft, ChevronRight, Calendar, Split, FileText,
  Trash2, Pencil, BadgeDollarSign, History, PieChart as PieIcon, BarChart3,
  Repeat, Wallet, Database,
} from 'lucide-react'
import RecurringTab from '@/components/billing/RecurringTab'
import ExpensesTab, { type Expense } from '@/components/billing/ExpensesTab'

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
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const EMPTY = {
  client_id: '', project_id: '', amount: '', status: 'pending',
  description: '', due_date: '', paid_at: '',
}

const BTN_GHOST = 'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors'

const DONUT_COLORS = ['#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#e5e5e5']

function invoiceMonthDate(inv: Invoice) {
  return new Date(inv.due_date || inv.created_at)
}
function invoiceCobrado(inv: Invoice) {
  return inv.status === 'paid' ? Number(inv.amount) : (inv.paid_amount || 0)
}
function invoiceResta(inv: Invoice) {
  return inv.status === 'paid' ? 0 : Math.max(0, Number(inv.amount) - (inv.paid_amount || 0))
}
function isUnpaid(inv: Invoice) {
  return ['pending', 'partial', 'overdue'].includes(inv.status) && invoiceResta(inv) > 0
}

function TooltipYear({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)' }}>
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: ${Number(p.value).toLocaleString('es-AR')}</p>
      ))}
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
  const [showCarryOver, setShowCarryOver] = useState(false)

  const [tab, setTab] = useState<'invoices' | 'recurring' | 'expenses'>('invoices')
  const [expenses, setExpenses]             = useState<Expense[]>([])
  const [expensesTotal, setExpensesTotal]   = useState(0)
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [billingMissing, setBillingMissing] = useState(false)

  const now = new Date()
  const [selYear, setSelYear]   = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())

  const [paymentInvoice, setPaymentInvoice]     = useState<Invoice | null>(null)
  const [payments, setPayments]                 = useState<Payment[]>([])
  const [paymentTotalPaid, setPaymentTotalPaid] = useState(0)
  const [paymentAmount, setPaymentAmount]       = useState('')
  const [paymentDate, setPaymentDate]           = useState(new Date().toISOString().split('T')[0])
  const [paymentNote, setPaymentNote]           = useState('')
  const [paymentLoading, setPaymentLoading]     = useState(false)
  const [paymentSaving, setPaymentSaving]       = useState(false)

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

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true)
    try {
      const res  = await fetch(`/api/expenses?month=${selMonth + 1}&year=${selYear}`)
      const data = await res.json()
      if (data.code === 'PGRST205') { setBillingMissing(true) }
      else {
        setExpenses(data.expenses || [])
        setExpensesTotal(data.total || 0)
      }
    } catch { /* non-critical */ }
    finally { setExpensesLoading(false) }
  }, [selMonth, selYear])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  const onBillingMissing = useCallback(() => setBillingMissing(true), [])

  function prevMonth() {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1) }
    else setSelMonth(m => m - 1)
  }
  function nextMonth() {
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1) }
    else setSelMonth(m => m + 1)
  }
  function goToCurrentMonth() {
    setSelYear(now.getFullYear()); setSelMonth(now.getMonth())
  }

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth()

  function handleBarClick(d: unknown) {
    const item = d as { year?: number; month?: number; payload?: { year: number; month: number } }
    const p = item.payload ?? item
    if (p.year !== undefined && p.month !== undefined) { setSelYear(p.year); setSelMonth(p.month) }
  }

  function monthInvoicesOf(year: number, month: number) {
    return invoices.filter(inv => {
      const d = invoiceMonthDate(inv)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }

  const monthInvoices = useMemo(
    () => monthInvoicesOf(selYear, selMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invoices, selYear, selMonth],
  )

  function statsOf(list: Invoice[]) {
    const cobrado   = list.reduce((s, i) => s + invoiceCobrado(i), 0)
    const pendiente = list.filter(i => ['pending', 'partial'].includes(i.status)).reduce((s, i) => s + invoiceResta(i), 0)
    const vencido   = list.filter(i => i.status === 'overdue').reduce((s, i) => s + invoiceResta(i), 0)
    const total     = list.reduce((s, i) => s + Number(i.amount), 0)
    return { cobrado, pendiente, vencido, total, count: list.length }
  }

  const monthStats = useMemo(() => statsOf(monthInvoices), [monthInvoices])

  // Mes anterior — para comparativa
  const prevMonthStats = useMemo(() => {
    const y = selMonth === 0 ? selYear - 1 : selYear
    const m = selMonth === 0 ? 11 : selMonth - 1
    return statsOf(monthInvoicesOf(y, m))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, selYear, selMonth])

  const deltaPct = prevMonthStats.cobrado > 0
    ? Math.round(((monthStats.cobrado - prevMonthStats.cobrado) / prevMonthStats.cobrado) * 100)
    : null

  // Arrastre: facturas impagas de meses ANTERIORES al seleccionado
  const carryOver = useMemo(() => {
    const cutoff = new Date(selYear, selMonth, 1)
    return invoices
      .filter(inv => isUnpaid(inv) && invoiceMonthDate(inv) < cutoff)
      .sort((a, b) => invoiceMonthDate(a).getTime() - invoiceMonthDate(b).getTime())
  }, [invoices, selYear, selMonth])

  const carryOverTotal = useMemo(() => carryOver.reduce((s, i) => s + invoiceResta(i), 0), [carryOver])

  // Gráfico anual: últimos 12 meses terminando en el mes seleccionado (o el actual si es futuro)
  const yearChart = useMemo(() => {
    const end = new Date(selYear, selMonth, 1)
    const buckets = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
      const list = monthInvoicesOf(d.getFullYear(), d.getMonth())
      const s = statsOf(list)
      buckets.push({
        label: `${MONTHS_SHORT[d.getMonth()]}${d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ''}`,
        fullLabel: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
        year: d.getFullYear(), month: d.getMonth(),
        Cobrado: s.cobrado, Pendiente: s.pendiente, Vencido: s.vencido,
        selected: d.getFullYear() === selYear && d.getMonth() === selMonth,
      })
    }
    return buckets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, selYear, selMonth])

  const bestMonth = useMemo(() => {
    const withRevenue = yearChart.filter(b => b.Cobrado > 0)
    if (!withRevenue.length) return null
    return withRevenue.reduce((best, b) => b.Cobrado > best.Cobrado ? b : best)
  }, [yearChart])

  const avgMonthly = useMemo(() => {
    const withRevenue = yearChart.filter(b => b.Cobrado > 0)
    if (!withRevenue.length) return 0
    return Math.round(withRevenue.reduce((s, b) => s + b.Cobrado, 0) / withRevenue.length)
  }, [yearChart])

  // Desglose por cliente del mes seleccionado (sobre el total facturado)
  const clientBreakdown = useMemo(() => {
    const byClient: Record<string, number> = {}
    for (const inv of monthInvoices) {
      const name = inv.clients?.name || 'Sin cliente'
      byClient[name] = (byClient[name] || 0) + Number(inv.amount)
    }
    const sorted = Object.entries(byClient).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 5).map(([name, value]) => ({ name, value }))
    const rest = sorted.slice(5).reduce((s, [, v]) => s + v, 0)
    if (rest > 0) top.push({ name: 'Otros', value: rest })
    return top
  }, [monthInvoices])

  const displayInvoices = useMemo(() => {
    const base = (showAllMonths || !!statusFilter) ? invoices : monthInvoices
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
    setSaving(true); setSaveError(null)
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

  const remaining  = paymentInvoice ? Math.max(0, Number(paymentInvoice.amount) - paymentTotalPaid) : 0
  const monthPct   = monthStats.total > 0 ? Math.round((monthStats.cobrado / monthStats.total) * 100) : 0
  const breakdownTotal = clientBreakdown.reduce((s, c) => s + c.value, 0)

  return (
    <>
      <Header
        title="Facturación"
        subtitle="Revenue tracking"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSplit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Split size={12}/> Split 50/50
            </button>
            <Button onClick={openNew} size="sm"><Plus size={13}/> Nueva factura</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ── HERO: Mes seleccionado ── */}
        <div className="panel-neon overflow-hidden animate-fade-up relative">
          {/* Glow decorativo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.06), transparent 70%)' }} />

          <div className="flex items-center justify-between px-6 py-5 relative">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#fff'; el.style.borderColor = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--text-3)'; el.style.borderColor = 'var(--border)' }}
            >
              <ChevronLeft size={16}/>
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2.5">
                <h2 className="text-[26px] font-bold neon-text leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                  {MONTHS_ES[selMonth]} {selYear}
                </h2>
                {deltaPct !== null && monthStats.cobrado > 0 && (
                  <span
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={deltaPct >= 0
                      ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                      : { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
                    }
                  >
                    {deltaPct >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                    {deltaPct >= 0 ? '+' : ''}{deltaPct}% vs {MONTHS_SHORT[selMonth === 0 ? 11 : selMonth - 1]}
                  </span>
                )}
              </div>
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-3)' }}>
                {monthStats.count} {monthStats.count === 1 ? 'factura' : 'facturas'} · ${formatNumber(monthStats.total)} facturado
                {!isCurrentMonth && (
                  <button onClick={goToCurrentMonth} className="ml-2 underline underline-offset-2 transition-colors" style={{ color: 'var(--amber)' }}>
                    volver a hoy
                  </button>
                )}
              </p>
            </div>

            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#fff'; el.style.borderColor = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--text-3)'; el.style.borderColor = 'var(--border)' }}
            >
              <ChevronRight size={16}/>
            </button>
          </div>

          <hr className="neon-divider mx-6" />

          {/* Stats del mes */}
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Cobrado',    value: monthStats.cobrado,   className: 'neon-green', sub: `${monthPct}% del facturado` },
              { label: 'Pendiente',  value: monthStats.pendiente, className: 'neon-amber', sub: 'por cobrar este mes' },
              { label: 'Vencido',    value: monthStats.vencido,   className: '', color: monthStats.vencido > 0 ? '#f87171' : 'var(--text-4)', sub: monthStats.vencido > 0 ? 'requiere atención' : 'nada vencido' },
              { label: 'Proyección', value: monthStats.cobrado + monthStats.pendiente + monthStats.vencido, className: 'neon-text', sub: 'si cobrás todo' },
            ].map((s, i) => (
              <div key={s.label} className="px-6 py-5" style={i < 3 ? { borderRight: '1px solid var(--border)' } : {}}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>{s.label}</p>
                <p className={`text-[24px] font-bold leading-none ${s.className}`} style={{ fontFamily: 'var(--font-display)', ...(s.color ? { color: s.color } : {}) }}>
                  ${formatNumber(s.value)}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-4)' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Barra de progreso del mes */}
          {monthStats.total > 0 && (
            <div className="px-6 pb-5 pt-1">
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
                <div className="h-full transition-all duration-700" style={{ width: `${(monthStats.cobrado / monthStats.total) * 100}%`, background: '#34d399', boxShadow: '0 0 10px rgba(16,185,129,0.6)' }}/>
                <div className="h-full transition-all duration-700" style={{ width: `${(monthStats.pendiente / monthStats.total) * 100}%`, background: '#fbbf24', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }}/>
                <div className="h-full transition-all duration-700" style={{ width: `${(monthStats.vencido / monthStats.total) * 100}%`, background: '#f87171', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}/>
              </div>
              <div className="flex gap-4 mt-2.5 text-[10px]" style={{ color: 'var(--text-3)' }}>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(16,185,129,0.7)' }}/>Cobrado</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#fbbf24', boxShadow: '0 0 6px rgba(245,158,11,0.7)' }}/>Pendiente</span>
                {monthStats.vencido > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f87171', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }}/>Vencido</span>}
              </div>
            </div>
          )}

          {monthStats.count === 0 && !loading && (
            <div className="px-6 pb-5 text-center text-[13px]" style={{ color: 'var(--text-4)' }}>Sin facturas este mes</div>
          )}
        </div>

        {/* ── ARRASTRE de meses anteriores ── */}
        {carryOver.length > 0 && (
          <div className="rounded-2xl overflow-hidden animate-fade-up stagger-1" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <button onClick={() => setShowCarryOver(v => !v)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <History size={15} style={{ color: 'var(--amber)' }}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold" style={{ color: 'var(--amber)' }}>
                  Arrastrás ${formatNumber(carryOverTotal)} de meses anteriores
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {carryOver.length} {carryOver.length === 1 ? 'factura impaga' : 'facturas impagas'} de antes de {MONTHS_ES[selMonth]} — tocá para {showCarryOver ? 'ocultar' : 'ver'}
                </p>
              </div>
              <ChevronRight size={15} className="shrink-0 transition-transform" style={{ color: 'var(--amber)', transform: showCarryOver ? 'rotate(90deg)' : 'none' }}/>
            </button>

            {showCarryOver && (
              <div className="px-5 pb-4 space-y-2">
                {carryOver.map(inv => {
                  const d = invoiceMonthDate(inv)
                  return (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-white truncate">{inv.clients?.name || '—'}</p>
                          <StatusBadge status={inv.status}/>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {inv.invoice_number} · {MONTHS_ES[d.getMonth()]} {d.getFullYear()}
                          {inv.description ? ` · ${inv.description}` : ''}
                        </p>
                      </div>
                      <p className="text-[15px] font-bold shrink-0" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                        ${invoiceResta(inv).toLocaleString()}
                      </p>
                      <button
                        onClick={() => openPaymentModal(inv)}
                        className={`${BTN_GHOST} bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/20 shrink-0`}
                      >
                        <CreditCard size={11}/> Cobrar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTADO NETO DEL MES ── */}
        {!billingMissing && (() => {
          const neto    = monthStats.cobrado - expensesTotal
          const netoPos = neto >= 0
          return (
            <div className="panel-neon px-6 py-4 animate-fade-up stagger-1 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-5 flex-wrap flex-1">
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Cobrado</p>
                  <p className="text-[18px] font-bold neon-green leading-none" style={{ fontFamily: 'var(--font-display)' }}>${formatNumber(monthStats.cobrado)}</p>
                </div>
                <span className="text-[18px]" style={{ color: 'var(--text-4)' }}>−</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Gastos</p>
                  <p className="text-[18px] font-bold leading-none" style={{ color: '#f87171', fontFamily: 'var(--font-display)', textShadow: '0 0 12px rgba(248,113,113,0.35)' }}>
                    ${formatNumber(expensesTotal)}
                  </p>
                </div>
                <span className="text-[18px]" style={{ color: 'var(--text-4)' }}>=</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Neto de {MONTHS_ES[selMonth]}</p>
                  <p className={`text-[22px] font-bold leading-none ${netoPos ? 'neon-text' : ''}`}
                    style={{ fontFamily: 'var(--font-display)', ...(netoPos ? {} : { color: '#f87171' }) }}>
                    ${formatNumber(neto)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl shrink-0"
                style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Split size={14} style={{ color: 'var(--amber)' }}/>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>Cada socio (50%)</p>
                  <p className="text-[17px] font-bold neon-amber leading-none mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                    ${formatNumber(neto / 2)}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Aviso migración pendiente ── */}
        {billingMissing && (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3 animate-fade-up"
            style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.25)' }}>
            <Database size={16} style={{ color: '#60a5fa' }} className="shrink-0"/>
            <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              <span className="font-bold" style={{ color: '#60a5fa' }}>Falta un paso:</span> para activar Recurrentes, Gastos y el neto mensual, ejecutá <span className="font-mono text-[11px]">supabase/billing-upgrade.sql</span> en el SQL Editor de Supabase.
            </p>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex gap-2 animate-fade-up stagger-1">
          {([
            { key: 'invoices',  label: 'Facturas',    icon: <FileText size={13}/> },
            { key: 'recurring', label: 'Recurrentes', icon: <Repeat size={13}/> },
            { key: 'expenses',  label: 'Gastos',      icon: <Wallet size={13}/> },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
              style={tab === t.key
                ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', boxShadow: '0 0 16px rgba(255,255,255,0.06)' }
                : { background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: RECURRENTES ══ */}
        {tab === 'recurring' && !billingMissing && (
          <RecurringTab
            selMonth={selMonth} selYear={selYear} clients={clients}
            onGenerated={load} onTablesMissing={onBillingMissing}
          />
        )}

        {/* ══ TAB: GASTOS ══ */}
        {tab === 'expenses' && !billingMissing && (
          <ExpensesTab
            expenses={expenses} total={expensesTotal} loading={expensesLoading}
            monthLabel={`${MONTHS_ES[selMonth]} ${selYear}`} onReload={loadExpenses}
          />
        )}

        {/* ══ TAB: FACTURAS ══ */}
        {tab === 'invoices' && (<>
        {/* ── GRÁFICOS: año + desglose por cliente ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-2">

          {/* Últimos 12 meses */}
          <div className="lg:col-span-2 panel-neon p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={13} style={{ color: 'var(--text-3)' }}/>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>Últimos 12 meses</p>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>Tocá una barra para ir a ese mes</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                  Promedio mensual: <span className="font-bold text-white">${formatNumber(avgMonthly)}</span>
                </p>
                {bestMonth && (
                  <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                    Mejor mes: <span className="font-bold neon-green">{bestMonth.fullLabel} · ${formatNumber(bestMonth.Cobrado)}</span>
                  </p>
                )}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={yearChart} barSize={22} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={<TooltipYear/>} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
                <Bar
                  dataKey="Cobrado" stackId="a" fill="#34d399"
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  {yearChart.map((b, i) => (
                    <Cell key={i} fill={b.selected ? '#34d399' : 'rgba(52,211,153,0.55)'} style={b.selected ? { filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.7))' } : {}}/>
                  ))}
                </Bar>
                <Bar
                  dataKey="Pendiente" stackId="a" fill="#fbbf24"
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  {yearChart.map((b, i) => (
                    <Cell key={i} fill={b.selected ? '#fbbf24' : 'rgba(251,191,36,0.45)'}/>
                  ))}
                </Bar>
                <Bar
                  dataKey="Vencido" stackId="a" radius={[5,5,0,0]} fill="#f87171"
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  {yearChart.map((b, i) => (
                    <Cell key={i} fill={b.selected ? '#f87171' : 'rgba(248,113,113,0.45)'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Desglose por cliente */}
          <div className="panel-neon p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon size={13} style={{ color: 'var(--text-3)' }}/>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>
                Por cliente — {MONTHS_SHORT[selMonth]}
              </p>
            </div>

            {clientBreakdown.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[12px]" style={{ color: 'var(--text-4)' }}>Sin datos este mes</p>
              </div>
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={clientBreakdown} dataKey="value" nameKey="name"
                        innerRadius={42} outerRadius={62} paddingAngle={3}
                        stroke="rgba(0,0,0,0.4)" strokeWidth={2}
                      >
                        {clientBreakdown.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipYear/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[15px] font-bold neon-text leading-none" style={{ fontFamily: 'var(--font-display)' }}>${formatNumber(breakdownTotal)}</p>
                    <p className="text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-4)' }}>facturado</p>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  {clientBreakdown.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length], boxShadow: `0 0 5px ${DONUT_COLORS[i % DONUT_COLORS.length]}90` }}/>
                      <p className="text-[12px] flex-1 truncate" style={{ color: 'var(--text-2)' }}>{c.name}</p>
                      <span className="text-[11px] font-bold text-white shrink-0">${formatNumber(c.value)}</span>
                      <span className="text-[10px] w-9 text-right shrink-0" style={{ color: 'var(--text-4)' }}>
                        {breakdownTotal > 0 ? Math.round((c.value / breakdownTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Stats globales ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 animate-fade-up stagger-3">
          <StatCard label="Total cobrado"  value={`$${formatNumber(stats.cobrado ?? stats.paid)}`} sub="histórico, incl. parciales" icon={<CheckCircle2 size={14}/>} color="green"  animDelay="0.05s" />
          <StatCard label="Por cobrar"     value={`$${formatNumber(stats.pending)}`}               sub="facturas pendientes"        icon={<Clock size={14}/>}        color="blue"   animDelay="0.10s" />
          <StatCard label="Vencido"        value={`$${formatNumber(stats.overdue)}`}               sub="requiere atención"          icon={<AlertTriangle size={14}/>} color="red"    animDelay="0.15s" />
          <StatCard label="MRR (30 días)"  value={`$${formatNumber(stats.mrr)}`}                   sub="cobrado este mes"           icon={<TrendingUp size={14}/>}   color="amber"  animDelay="0.20s" />
        </div>

        {/* ── Lista de facturas ── */}
        <div className="space-y-3 animate-fade-up stagger-4">
          <div className="flex items-center justify-between">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl text-[13px] focus:outline-none transition-colors"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <option value="">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="partial">Pago parcial</option>
              <option value="paid">Pagadas</option>
              <option value="overdue">Vencidas</option>
              <option value="draft">Borrador</option>
              <option value="canceled">Canceladas</option>
            </select>

            <button
              onClick={() => setShowAllMonths(v => !v)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border transition-colors"
              style={showAllMonths
                ? { background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--amber)' }
                : { background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }
              }
            >
              {showAllMonths ? 'Filtrando por mes' : 'Ver todas las facturas'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}/>
            </div>
          ) : displayInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <DollarSign size={22} style={{ color: 'var(--text-4)' }}/>
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                {showAllMonths ? 'No hay facturas' : `No hay facturas en ${MONTHS_ES[selMonth]}`}
              </p>
              <Button onClick={openNew} size="sm">Crear factura</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayInvoices.map(inv => {
                const paidAmt    = inv.paid_amount || 0
                const rest       = Math.max(0, Number(inv.amount) - paidAmt)
                const hasPartial = paidAmt > 0 && inv.status !== 'paid'
                const pct        = Number(inv.amount) > 0 ? Math.min(100, Math.round((paidAmt / Number(inv.amount)) * 100)) : 0

                return (
                  <div
                    key={inv.id}
                    className="rounded-xl p-5 transition-all duration-200 animate-fade-up"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.25)'; el.style.boxShadow = '0 0 20px rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none' }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[11px] font-mono" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</span>
                          <StatusBadge status={inv.status}/>
                          {inv.due_date && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-3)' }}>
                              <Calendar size={10}/>{formatDate(inv.due_date).split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[16px] font-bold text-white truncate">{inv.clients?.name || '—'}</p>
                        {inv.projects?.name && (
                          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>{inv.projects.name}</p>
                        )}
                        {inv.description && (
                          <p className="text-[13px] mt-1.5 line-clamp-2" style={{ color: 'var(--text-2)' }}>{inv.description}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>${Number(inv.amount).toLocaleString()}</p>
                        {inv.status === 'paid' && (
                          <p className="text-[12px] neon-green font-semibold mt-0.5">✓ Pagado</p>
                        )}
                        {hasPartial && (
                          <div className="mt-0.5">
                            <p className="text-[11px] text-emerald-400">${paidAmt.toLocaleString()} pagado</p>
                            <p className="text-[14px] font-bold text-amber-400">Resta ${rest.toLocaleString()}</p>
                          </div>
                        )}
                        {inv.status === 'overdue' && (
                          <p className="text-[12px] text-red-400 font-semibold mt-0.5">Vencida</p>
                        )}
                      </div>
                    </div>

                    {hasPartial && (
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-3)' }}>
                          <span>Progreso de cobro</span>
                          <span className="font-bold text-amber-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#fbbf24', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }}/>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => window.open(`/invoice-print/${inv.id}`, '_blank')}
                        className={BTN_GHOST}
                        style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      >
                        <FileText size={11}/> PDF
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className={BTN_GHOST}
                        style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      >
                        <Pencil size={11}/> Editar
                      </button>
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className={`${BTN_GHOST} bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/20`}
                          >
                            <CreditCard size={11}/> Registrar pago
                          </button>
                          <button
                            onClick={() => markPaid(inv.id)}
                            className={`${BTN_GHOST} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20`}
                          >
                            <CheckCircle2 size={11}/> Cobrado total
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        className={`ml-auto ${BTN_GHOST} bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20`}
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
        </>)}
      </div>

      {/* ── Modal Nueva / Editar Factura ── */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}
        title={editInvoice ? `Editar ${editInvoice.invoice_number}` : 'Nueva factura'}
      >
        <div className="space-y-4">
          {editInvoice ? (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>Cliente</p>
              <p className="text-[13px] font-semibold text-white">{editInvoice.clients?.name || '—'}</p>
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
            <Input label="Monto (ARS) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="500000"/>
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="canceled">Cancelada</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Vencimiento" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} type="date"/>
            {form.status === 'paid' && (
              <Input label="Fecha de pago" value={form.paid_at} onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))} type="date"/>
            )}
          </div>

          <Textarea
            label="Descripción"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Servicios de marketing digital — Junio 2026"
          />

          {!editInvoice && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <button type="button" onClick={() => setUseCuotas(v => !v)} className="flex items-center gap-2.5 w-full text-left">
                <div className="w-5 h-5 rounded flex items-center justify-center border transition-colors" style={useCuotas ? { background: 'var(--amber)', borderColor: 'var(--amber)' } : { background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
                  {useCuotas && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Dividir en cuotas</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Genera facturas separadas por cuota</p>
                </div>
              </button>

              {useCuotas && form.amount && (
                <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-3)' }}>Cantidad de cuotas</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[2, 3, 4, 6, 12].map(n => (
                          <button key={n} type="button" onClick={() => setCuotasCount(n)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                            style={cuotasCount === n ? { background: 'var(--amber-dim)', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--amber)' } : { background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                            {n}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-3)' }}>Días entre cuotas</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[7, 15, 30, 60].map(d => (
                          <button key={d} type="button" onClick={() => setCuotasDays(d)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                            style={cuotasDays === d ? { background: 'var(--amber-dim)', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--amber)' } : { background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                            {d === 30 ? '1 mes' : d === 60 ? '2 meses' : `${d}d`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Preview</p>
                    {Array.from({ length: cuotasCount }, (_, i) => {
                      const total   = parseFloat(form.amount)
                      const cAmt    = Math.floor(total / cuotasCount)
                      const lastAmt = total - cAmt * (cuotasCount - 1)
                      const base    = form.due_date ? new Date(form.due_date) : new Date()
                      const due     = new Date(base)
                      due.setDate(due.getDate() + i * cuotasDays)
                      return (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <span style={{ color: 'var(--text-3)' }}>Cuota {i + 1}/{cuotasCount}</span>
                          <span className="font-bold" style={{ color: 'var(--amber)' }}>${(i === cuotasCount - 1 ? lastAmt : cAmt).toLocaleString()}</span>
                          <span style={{ color: 'var(--text-4)' }}>{due.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
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
            <Button onClick={save} disabled={saving || (!editInvoice && (!form.client_id || !form.amount)) || (!!editInvoice && !form.amount)}>
              {saving ? 'Guardando...' : editInvoice ? 'Guardar cambios' : useCuotas ? `Crear ${cuotasCount} cuotas` : 'Crear factura'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Pagos Parciales ── */}
      <Modal open={!!paymentInvoice} onClose={() => setPaymentInvoice(null)} title={paymentInvoice ? `Pagos — ${paymentInvoice.invoice_number}` : ''}>
        {paymentInvoice && (
          <div className="space-y-5">
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-white">{paymentInvoice.clients?.name}</p>
                  {paymentInvoice.description && (
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>{paymentInvoice.description}</p>
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
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Total</p>
                  <p className="text-[13px] font-bold text-white">${Number(paymentInvoice.amount).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[10px] uppercase tracking-wide mb-1 text-emerald-400/60">Pagado</p>
                  <p className="text-[13px] font-bold text-emerald-400">${paymentTotalPaid.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
                  <p className="text-[10px] uppercase tracking-wide mb-1 text-amber-400/60">Resta</p>
                  <p className="text-[13px] font-bold text-amber-400">${remaining.toLocaleString()}</p>
                </div>
              </div>

              {paymentTotalPaid > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-3)' }}>
                    <span>Progreso</span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((paymentTotalPaid / Number(paymentInvoice.amount)) * 100))}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (paymentTotalPaid / Number(paymentInvoice.amount)) * 100)}%` }}/>
                  </div>
                </div>
              )}
            </div>

            {paymentLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}/>
              </div>
            ) : payments.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Historial de pagos</p>
                <div className="space-y-2">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <BadgeDollarSign size={13} className="text-emerald-400"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-emerald-400">${Number(p.amount).toLocaleString()}</p>
                        {p.note && <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{p.note}</p>}
                      </div>
                      <p className="text-[11px] shrink-0" style={{ color: 'var(--text-4)' }}>
                        {new Date(p.paid_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remaining > 0 && (
              <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Registrar pago</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Monto *" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" placeholder={remaining.toLocaleString()}/>
                  <Input label="Fecha" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} type="date"/>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[remaining, Math.floor(remaining / 2), Math.floor(Number(paymentInvoice.amount) / 2)]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map(val => (
                      <button key={val} type="button" onClick={() => setPaymentAmount(String(val))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors"
                        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      >
                        ${val.toLocaleString()}
                      </button>
                    ))
                  }
                </div>
                <Input label="Nota (opcional)" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Transferencia, efectivo..."/>
                <Button onClick={registerPayment} disabled={paymentSaving || !paymentAmount || parseFloat(paymentAmount) <= 0} className="w-full">
                  {paymentSaving ? 'Registrando...' : `Registrar $${parseFloat(paymentAmount || '0').toLocaleString() || '---'}`}
                </Button>
              </div>
            )}
            {remaining <= 0 && (
              <p className="text-center text-[13px] text-emerald-400 font-bold py-2">✓ Factura completamente pagada</p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal Split 50/50 ── */}
      <Modal open={showSplit} onClose={() => setShowSplit(false)} title="Split 50/50 — Facundo & Mauricio">
        <div className="space-y-4">
          {/* Mes seleccionado: split sobre el NETO */}
          {(() => {
            const neto = monthStats.cobrado - expensesTotal
            return (
              <div className="rounded-xl p-4" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
                  {MONTHS_ES[selMonth]} {selYear} · sobre el neto real
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Cobrado', value: monthStats.cobrado, color: '#34d399' },
                    { label: 'Gastos',  value: -expensesTotal,     color: '#f87171' },
                    { label: 'Neto',    value: neto,               color: '#fff' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                      <p className="text-[14px] font-bold" style={{ color: s.color }}>
                        {s.value < 0 ? '−' : ''}${formatNumber(Math.abs(s.value))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-3" style={{ borderTop: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>Cada socio se lleva</p>
                  <p className="text-[30px] font-bold neon-amber leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                    ${formatNumber(neto / 2)}
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Histórico (bruto, referencia) */}
          <p className="text-[10px] uppercase tracking-widest pt-1" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Histórico · bruto de referencia</p>
          {[
            { label: 'Cobrado total',  sub: 'incl. parciales',     value: stats.cobrado ?? stats.paid, color: '#22c55e' },
            { label: 'Por cobrar',     sub: 'pendiente + vencido', value: stats.pending + stats.overdue, color: '#60a5fa' },
          ].map(row => (
            <div key={row.label} className="rounded-xl p-4" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>{row.label} · {row.sub}</p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Total</p>
                  <p className="text-[16px] font-bold" style={{ color: row.color }}>${formatNumber(row.value)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Cada uno</p>
                  <p className="text-[20px] font-bold" style={{ color: row.color, fontFamily: 'var(--font-display)' }}>${formatNumber(row.value / 2)}</p>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setShowSplit(false)} className="w-full text-[12px] transition-colors py-1" style={{ color: 'var(--text-3)' }}>
            Cerrar
          </button>
        </div>
      </Modal>
    </>
  )
}
