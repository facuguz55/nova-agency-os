'use client'
import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatNumber } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Receipt, Trash2, Repeat, Wallet } from 'lucide-react'

export interface Expense {
  id: string; label: string; amount: number; category: string
  expense_date: string; recurring: boolean; notes: string | null
}

export const EXPENSE_CATEGORIES: Record<string, { label: string; color: string }> = {
  herramientas: { label: 'Herramientas', color: '#60a5fa' },
  publicidad:   { label: 'Publicidad',   color: '#f472b6' },
  freelance:    { label: 'Freelance',    color: '#a78bfa' },
  impuestos:    { label: 'Impuestos',    color: '#f87171' },
  servicios:    { label: 'Servicios',    color: '#fbbf24' },
  otro:         { label: 'Otro',         color: '#9ca3af' },
}

const EMPTY = { label: '', amount: '', category: 'herramientas', expense_date: new Date().toISOString().split('T')[0], recurring: false, notes: '' }

function TooltipExp({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)' }}>
      <p className="font-medium" style={{ color: payload[0].payload.color }}>{payload[0].name}: ${Number(payload[0].value).toLocaleString('es-AR')}</p>
    </div>
  )
}

export default function ExpensesTab({ expenses, total, loading, monthLabel, onReload }: {
  expenses: Expense[]; total: number; loading: boolean
  monthLabel: string
  onReload: () => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)

  const fixed  = expenses.filter(e => e.recurring)
  const oneOff = expenses.filter(e => !e.recurring)
  const fixedTotal = fixed.reduce((s, e) => s + Number(e.amount), 0)

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})
  )
    .map(([cat, value]) => ({ name: EXPENSE_CATEGORIES[cat]?.label || cat, value, color: EXPENSE_CATEGORIES[cat]?.color || '#9ca3af' }))
    .sort((a, b) => b.value - a.value)

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label:        form.label,
          amount:       parseFloat(form.amount),
          category:     form.category,
          expense_date: form.expense_date,
          recurring:    form.recurring,
          notes:        form.notes || null,
        }),
      })
      setShowModal(false); setForm(EMPTY)
      onReload()
    } finally { setSaving(false) }
  }

  async function remove(e: Expense) {
    if (!confirm(`¿Eliminar el gasto "${e.label}"?${e.recurring ? ' Es un gasto fijo: deja de contar en todos los meses.' : ''}`)) return
    await fetch(`/api/expenses/${e.id}`, { method: 'DELETE' })
    onReload()
  }

  function ExpenseRow({ e }: { e: Expense }) {
    const cat = EXPENSE_CATEGORIES[e.category] || EXPENSE_CATEGORIES.otro
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.borderColor = `${cat.color}45` }}
        onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}90` }}/>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">
            {e.label}
            {e.recurring && <Repeat size={10} className="inline ml-1.5 -mt-0.5" style={{ color: 'var(--text-3)' }}/>}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            {cat.label}{e.notes ? ` · ${e.notes}` : ''}{!e.recurring ? ` · ${new Date(e.expense_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}` : ' · fijo mensual'}
          </p>
        </div>
        <p className="text-[15px] font-bold shrink-0" style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}>
          −${Number(e.amount).toLocaleString('es-AR')}
        </p>
        <button onClick={() => remove(e)}
          className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 shrink-0">
          <Trash2 size={12}/>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header: total + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel-neon p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', boxShadow: '0 0 16px rgba(248,113,113,0.15)' }}>
              <Wallet size={17} style={{ color: '#f87171' }}/>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>Gastos de {monthLabel}</p>
              <p className="text-[26px] font-bold leading-none mt-1" style={{ color: '#f87171', fontFamily: 'var(--font-display)', textShadow: '0 0 14px rgba(248,113,113,0.4)' }}>
                ${formatNumber(total)}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-4)' }}>
                ${formatNumber(fixedTotal)} fijos · ${formatNumber(total - fixedTotal)} del mes
              </p>
            </div>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowModal(true) }} size="sm"><Plus size={13}/> Nuevo gasto</Button>
        </div>

        {/* Donut por categoría */}
        <div className="panel-neon p-5">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--text-3)' }}>Por categoría</p>
          {byCategory.length === 0 ? (
            <p className="text-[12px] py-6 text-center" style={{ color: 'var(--text-4)' }}>Sin gastos este mes</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-[84px] h-[84px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={26} outerRadius={40} paddingAngle={3} stroke="rgba(0,0,0,0.4)" strokeWidth={2}>
                      {byCategory.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip content={<TooltipExp/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                {byCategory.slice(0, 4).map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }}/>
                    <p className="text-[10px] flex-1 truncate" style={{ color: 'var(--text-2)' }}>{d.name}</p>
                    <span className="text-[10px] font-bold text-white shrink-0">${formatNumber(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}/>
        </div>
      ) : expenses.length === 0 ? (
        <div className="panel-neon flex flex-col items-center justify-center py-16 gap-3">
          <Receipt size={24} style={{ color: 'var(--text-4)' }}/>
          <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Sin gastos registrados en {monthLabel}</p>
          <p className="text-[11px] max-w-sm text-center" style={{ color: 'var(--text-4)' }}>
            Cargá herramientas, publicidad y freelancers. Los gastos fijos se repiten solos todos los meses, y el neto del mes se calcula automático.
          </p>
          <Button onClick={() => { setForm(EMPTY); setShowModal(true) }} size="sm">Registrar gasto</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {fixed.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>
                Fijos mensuales · ${formatNumber(fixedTotal)}
              </p>
              {fixed.map(e => <ExpenseRow key={e.id} e={e}/>)}
            </div>
          )}
          {oneOff.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>
                Del mes · ${formatNumber(total - fixedTotal)}
              </p>
              {oneOff.map(e => <ExpenseRow key={e.id} e={e}/>)}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo gasto">
        <div className="space-y-4">
          <Input label="Concepto *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Suscripción n8n"/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto (ARS) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="25000"/>
            <Select label="Categoría" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>

          <button type="button" onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 rounded-xl transition-all"
            style={form.recurring
              ? { background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.3)' }
              : { background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0"
              style={form.recurring ? { background: '#f87171', borderColor: '#f87171' } : { background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
              {form.recurring && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">Gasto fijo mensual</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Se cuenta automáticamente todos los meses (ej: suscripciones)</p>
            </div>
          </button>

          {!form.recurring && (
            <Input label="Fecha" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} type="date"/>
          )}
          <Input label="Nota (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Plan anual, tarjeta de Mauri..."/>

          <div className="flex gap-3 pt-1">
            <Button onClick={save} disabled={saving || !form.label || !form.amount}>
              {saving ? 'Guardando...' : 'Registrar gasto'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
