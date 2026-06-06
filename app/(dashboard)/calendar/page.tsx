'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface Task {
  id: string; title: string; priority: string; status: string; due_date: string
  projects: { name: string } | null
}
interface Invoice {
  id: string; invoice_number: string; amount: number; status: string
  description: string | null; due_date: string | null; clients: { name: string } | null
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-300 border-red-500/20',
  high:   'bg-orange-500/20 text-orange-300 border-orange-500/20',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  low:    'bg-white/5 text-[var(--text-3)] border-white/10',
}
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-[var(--text-3)]',
}

export default function CalendarPage() {
  usePageTitle('Calendario')
  const [tasks, setTasks]         = useState<Task[]>([])
  const [invoices, setInvoices]   = useState<Invoice[]>([])
  const [loading, setLoading]     = useState(true)
  const [date, setDate]           = useState(new Date())
  const [selected, setSelected]   = useState<number | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/tasks'), fetch('/api/invoices')])
      .then(([tRes, iRes]) => Promise.all([tRes.json(), iRes.json()]))
      .then(([t, i]) => {
        setTasks(t.tasks || [])
        setInvoices((i.invoices || []).filter((inv: Invoice) => inv.due_date))
        setLoading(false)
      })
  }, [])

  const year  = date.getFullYear()
  const month = date.getMonth()

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ]
  const numRows = totalCells / 7

  function tasksForDay(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date?.startsWith(d) && t.status !== 'done')
  }
  function invoicesForDay(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return invoices.filter(i => i.due_date?.startsWith(d) && i.status !== 'paid')
  }
  function isToday(day: number) {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
  }

  const selectedTasks    = selected ? tasksForDay(selected) : []
  const selectedInvoices = selected ? invoicesForDay(selected) : []
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 10)
  const upcomingInvoices = invoices
    .filter(i => i.due_date && i.status !== 'paid' && new Date(i.due_date!) >= new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  return (
    <>
      <Header title="Calendario" subtitle={`${MONTHS[month]} ${year}`} />

      <div className="flex-1 flex overflow-hidden bg-grid">

        {/* Grilla principal */}
        <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid var(--border)' }}>

          {/* Nav mes */}
          <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setDate(new Date(year, month - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={16}/>
            </button>
            <h2 className="text-sm font-bold text-white min-w-[130px] text-center">{MONTHS[month]} {year}</h2>
            <button onClick={() => setDate(new Date(year, month + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight size={16}/>
            </button>
            <button onClick={() => { setDate(new Date()); setSelected(new Date().getDate()) }}
              className="ml-1 px-3 h-7 text-[11px] text-[var(--amber)] hover:bg-[var(--amber-dim)] rounded-lg transition-all"
              style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
              Hoy
            </button>
          </div>

          {/* Cabecera días */}
          <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} className="text-[10px] text-[var(--text-4)] uppercase tracking-widest text-center py-2 font-semibold">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 min-h-0"
              style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}>
              {cells.map((day, i) => {
                if (!day) return (
                  <div key={i} className={cn(
                    'border-r border-b',
                    i % 7 === 6 && 'border-r-0',
                  )} style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}/>
                )

                const dayTasks    = tasksForDay(day)
                const dayInvoices = invoicesForDay(day)
                const today       = isToday(day)
                const isSel       = selected === day

                return (
                  <button key={i} onClick={() => setSelected(isSel ? null : day)}
                    className={cn(
                      'flex flex-col p-1.5 border-r border-b text-left transition-colors overflow-hidden min-h-0',
                      i % 7 === 6 && 'border-r-0',
                      !today && !isSel && 'hover:bg-white/[.015]',
                    )}
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      background: today ? 'rgba(245,158,11,0.04)' : isSel ? 'rgba(245,158,11,0.07)' : undefined,
                      boxShadow: isSel ? 'inset 0 0 0 1px rgba(245,158,11,0.25)' : undefined,
                    }}
                  >
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 shrink-0',
                    )}
                      style={today
                        ? { background: 'var(--amber)', color: '#000', fontWeight: 'bold' }
                        : { color: isSel ? 'var(--amber)' : 'var(--text-3)' }}
                    >
                      {day}
                    </span>
                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} className={cn('text-[10px] px-1.5 py-0.5 rounded border truncate leading-tight', PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.low)}>
                          {t.title}
                        </div>
                      ))}
                      {dayInvoices.slice(0, 1).map(i => (
                        <div key={i.id} className="text-[10px] px-1.5 py-0.5 rounded border truncate leading-tight bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          💰 {i.clients?.name || i.invoice_number}
                        </div>
                      ))}
                      {(dayTasks.length + dayInvoices.length) > 3 && (
                        <span className="text-[9px] text-[var(--text-4)] px-1">+{dayTasks.length + dayInvoices.length - 3} más</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden">

          {/* Día seleccionado */}
          <div className={cn('shrink-0 transition-all overflow-hidden', selected ? 'max-h-96' : 'max-h-0')}
            style={{ borderBottom: '1px solid var(--border)' }}>
            {selected && (
              <div className="p-4">
                <p className="text-xs font-semibold text-white mb-3 capitalize">
                  {new Date(year, month, selected).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {selectedTasks.length === 0 && selectedInvoices.length === 0 ? (
                  <p className="text-xs text-[var(--text-4)]">Sin eventos para este día</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map(t => (
                      <div key={t.id} className="flex items-start gap-2 p-2 rounded-xl"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[t.priority])}/>
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate">{t.title}</p>
                          {t.projects && <p className="text-[10px] text-[var(--text-4)] mt-0.5">{t.projects.name}</p>}
                        </div>
                      </div>
                    ))}
                    {selectedInvoices.map(i => (
                      <div key={i.id} className="flex items-start gap-2 p-2 rounded-xl bg-emerald-500/5" style={{ border: '1px solid rgba(52,211,153,0.2)' }}>
                        <span className="text-xs mt-0.5 shrink-0">💰</span>
                        <div className="min-w-0">
                          <p className="text-xs text-emerald-300 truncate">{i.clients?.name || i.invoice_number}</p>
                          <p className="text-[10px] text-emerald-400/60 mt-0.5">${Number(i.amount).toLocaleString()} · vence hoy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Próximas tareas */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[9px] font-semibold text-[var(--text-4)] uppercase tracking-widest mb-3">Próximas tareas</p>
            {upcoming.length === 0 && upcomingInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CalendarDays size={20} className="text-[var(--text-4)]"/>
                <p className="text-xs text-[var(--text-4)] text-center">Sin eventos próximos</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcoming.map(t => {
                  const d = new Date(t.due_date)
                  const isOverdue = d < new Date()
                  return (
                    <div key={t.id} className="flex items-center gap-2 py-2 last:border-0"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[t.priority])}/>
                      <p className="text-xs text-[var(--text-2)] truncate flex-1">{t.title}</p>
                      <span className={cn('text-[10px] shrink-0', isOverdue ? 'text-red-400' : 'text-[var(--text-4)]')}>
                        {d.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
                {upcomingInvoices.length > 0 && (
                  <>
                    <p className="text-[9px] font-semibold text-[var(--text-4)] uppercase tracking-widest mt-3 mb-2">Facturas por vencer</p>
                    {upcomingInvoices.map(i => {
                      const d = new Date(i.due_date!)
                      return (
                        <div key={i.id} className="flex items-center gap-2 py-2 last:border-0"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span className="text-[10px] shrink-0">💰</span>
                          <p className="text-xs text-emerald-400/80 truncate flex-1">{i.clients?.name || i.invoice_number}</p>
                          <span className="text-[10px] text-emerald-500/60 shrink-0">
                            {d.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
