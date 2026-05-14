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
import { Plus, DollarSign, Clock, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'

interface Invoice {
  id: string; invoice_number: string; amount: number; status: string
  description: string | null; due_date: string | null; paid_at: string | null
  created_at: string
  clients: { name: string; email: string | null } | null
  projects: { id: string; name: string; budget: number | null } | null
}
interface Stats { paid: number; pending: number; overdue: number; mrr: number }
interface Client { id: string; name: string }
interface Project { id: string; name: string; budget: number | null; client_id: string }

const EMPTY = { client_id: '', project_id: '', amount: '', status: 'pending', description: '', due_date: '' }

export default function InvoicesPage() {
  usePageTitle('Facturas')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats]       = useState<Stats>({ paid: 0, pending: 0, overdue: 0, mrr: 0 })
  const [clients, setClients]   = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    setInvoices(iData.invoices || [])
    setStats(iData.stats || { paid: 0, pending: 0, overdue: 0, mrr: 0 })
    setClients(cData.clients || [])
    setProjects(pData.projects || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  function openEdit(inv: Invoice) {
    setEditInvoice(inv)
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
    setForm(EMPTY)
    setShowModal(true)
  }

  // Proyectos filtrados por el cliente seleccionado
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
      let res: Response
      if (editInvoice) {
        res = await fetch(`/api/invoices/${editInvoice.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount:      parseFloat(form.amount),
            status:      form.status,
            description: form.description || null,
            due_date:    form.due_date || null,
            project_id:  form.project_id || null,
          }),
        })
      } else {
        res = await fetch('/api/invoices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            amount:     parseFloat(form.amount),
            due_date:   form.due_date   || null,
            project_id: form.project_id || null,
          }),
        })
      }
      if (!res.ok) {
        const body = await res.json()
        setSaveError(body.error || 'Error al guardar')
        setSaving(false)
        return
      }
      setShowModal(false); setEditInvoice(null); setForm(EMPTY); load()
    } catch (e) {
      setSaveError('Error de red')
    } finally {
      setSaving(false)
    }
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

  // Datos para el gráfico (últimos 6 meses)
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

  return (
    <>
      <Header
        title="Facturación"
        subtitle="Revenue tracking"
        actions={<Button onClick={openNew} size="sm"><Plus size={13}/> Nueva factura</Button>}
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-grid">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="MRR (30 días)" value={`$${formatNumber(stats.mrr)}`} icon={<TrendingUp size={16}/>} color="orange" sub="facturado este mes" />
          <StatCard label="Total cobrado"  value={`$${formatNumber(stats.paid)}`}    icon={<CheckCircle2 size={16}/>} color="green"  sub="histórico" />
          <StatCard label="Por cobrar"     value={`$${formatNumber(stats.pending)}`} icon={<Clock size={16}/>}        color="blue"   sub="pendiente" />
          <StatCard label="Vencido"        value={`$${formatNumber(stats.overdue)}`} icon={<AlertTriangle size={16}/>} color="purple" sub="overdue" />
        </div>

        {/* Gráfico */}
        <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-5">Revenue cobrado — últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${formatNumber(v)}`} />
              <Tooltip
                contentStyle={{ background: '#0e1a2e', border: '1px solid #1e2f4a', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Cobrado']}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? '#ff8c42' : '#1e2f4a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filtro y tabla */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40">
              <option value="">Todas</option>
              <option value="pending">Pendientes</option>
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
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-[#1e2f4a]/40 hover:bg-white/[.015] transition-colors last:border-0">
                      <td className="px-5 py-3 text-xs font-mono text-[#475569]">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-sm text-white font-medium">{inv.clients?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm text-[#475569]">{inv.projects?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm text-[#475569] max-w-xs truncate">{inv.description || '—'}</td>
                      <td className="px-5 py-3 text-sm font-bold text-white">${Number(inv.amount).toLocaleString()}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status}/></td>
                      <td className="px-5 py-3 text-xs text-[#475569]">{inv.due_date ? formatDate(inv.due_date).split(' ')[0] : '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/invoice-print/${inv.id}`, '_blank')}
                            className="text-xs px-2 py-1 bg-[#1e2f4a] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => openEdit(inv)}
                            className="text-xs px-2 py-1 bg-[#1e2f4a] hover:bg-[#253f60] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          {inv.status !== 'paid' && (
                            <button onClick={() => markPaid(inv.id)} className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors">
                              Cobrada
                            </button>
                          )}
                          <button onClick={() => deleteInvoice(inv.id)} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }} title={editInvoice ? `Editar factura ${editInvoice.invoice_number}` : 'Nueva factura'}>
        <div className="space-y-4">
          {editInvoice && (
            <div className="space-y-3">
              <div className="px-3 py-2 bg-[#0f1d30] border border-[#1a2d45] rounded-lg">
                <p className="text-xs text-[#64748b]">Cliente: <span className="text-white font-medium">{editInvoice.clients?.name || '—'}</span></p>
              </div>
              <Select
                label="Proyecto (opcional)"
                value={form.project_id}
                onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
              >
                <option value="">Sin proyecto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.budget ? ` — $${Number(p.budget).toLocaleString()}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {!editInvoice && (
            <>
              <Select label="Cliente *" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select
                label="Proyecto (opcional)"
                value={form.project_id}
                onChange={e => handleProjectSelect(e.target.value)}
              >
                <option value="">Sin proyecto</option>
                {projectsForClient.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.budget ? ` — $${Number(p.budget).toLocaleString()}` : ''}
                  </option>
                ))}
              </Select>
              {form.project_id && projects.find(p => p.id === form.project_id)?.budget && (
                <p className="text-xs text-[#ff8c42]/80 -mt-2">
                  Presupuesto del proyecto cargado automáticamente
                </p>
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto (ARS) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" step="0.01" placeholder="200.000" />
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="canceled">Cancelada</option>
            </Select>
          </div>
          <Input label="Fecha de vencimiento" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} type="date" />
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Servicios de marketing digital — Marzo 2026" />
          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || (!editInvoice && (!form.client_id || !form.amount)) || (!!editInvoice && !form.amount)}>
              {saving ? 'Guardando...' : editInvoice ? 'Guardar cambios' : 'Crear factura'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditInvoice(null); setSaveError(null) }}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
