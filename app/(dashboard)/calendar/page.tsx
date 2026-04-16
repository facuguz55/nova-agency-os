'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface Task {
  id: string; title: string; priority: string; status: string; due_date: string
  projects: { name: string } | null
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-300 border-red-500/20',
  high:   'bg-orange-500/20 text-orange-300 border-orange-500/20',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  low:    'bg-[#1e2f4a] text-[#475569] border-[#1e2f4a]',
}
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-blue-400', low: 'bg-[#475569]',
}

export default function CalendarPage() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate]       = useState(new Date())
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => { setTasks(d.tasks || []); setLoading(false) })
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

  function isToday(day: number) {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
  }

  const selectedTasks = selected ? tasksForDay(selected) : []
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 10)

  return (
    <>
      <Header title="Calendario" subtitle={`${MONTHS[month]} ${year}`} />

      <div className="flex-1 flex overflow-hidden bg-grid">

        {/* ── Grilla principal ── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1e2f4a]">

          {/* Nav mes */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1e2f4a] shrink-0">
            <button onClick={() => setDate(new Date(year, month - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={16}/>
            </button>
            <h2 className="text-sm font-bold text-white min-w-[130px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={() => setDate(new Date(year, month + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#475569] hover:text-white hover:bg-white/5 transition-all">
              <ChevronRight size={16}/>
            </button>
            <button onClick={() => { setDate(new Date()); setSelected(new Date().getDate()) }}
              className="ml-1 px-3 h-7 text-[11px] text-[#ff8c42] hover:bg-[#ff8c42]/10 rounded-lg transition-all border border-[#ff8c42]/20">
              Hoy
            </button>
          </div>

          {/* Cabecera días */}
          <div className="grid grid-cols-7 border-b border-[#1e2f4a] shrink-0">
            {DAYS.map(d => (
              <div key={d} className="text-[10px] text-[#334155] uppercase tracking-widest text-center py-2 font-semibold">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas — flex-1 + grid con rows dinámicas */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div
              className="flex-1 grid grid-cols-7 min-h-0"
              style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}
            >
              {cells.map((day, i) => {
                if (!day) return (
                  <div key={i} className={cn(
                    'border-r border-b border-[#1e2f4a]/40 bg-[#080f1e]/40',
                    i % 7 === 6 && 'border-r-0',
                  )}/>
                )

                const dayTasks  = tasksForDay(day)
                const today     = isToday(day)
                const isSel     = selected === day

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSel ? null : day)}
                    className={cn(
                      'flex flex-col p-1.5 border-r border-b border-[#1e2f4a]/40 text-left transition-colors overflow-hidden min-h-0',
                      i % 7 === 6 && 'border-r-0',
                      today   && 'bg-[#ff8c42]/5',
                      isSel   && 'bg-[#ff8c42]/8 ring-1 ring-inset ring-[#ff8c42]/30',
                      !today && !isSel && 'hover:bg-white/[.015]',
                    )}
                  >
                    {/* Número de día */}
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 shrink-0',
                      today  ? 'bg-[#ff8c42] text-white font-bold'
                             : isSel ? 'text-[#ff8c42]' : 'text-[#64748b]',
                    )}>
                      {day}
                    </span>

                    {/* Tareas */}
                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border truncate leading-tight',
                          PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.low,
                        )}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-[#334155] px-1">+{dayTasks.length - 3} más</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Panel lateral ── */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden">

          {/* Día seleccionado */}
          <div className={cn(
            'shrink-0 border-b border-[#1e2f4a] transition-all overflow-hidden',
            selected ? 'max-h-96' : 'max-h-0',
          )}>
            {selected && (
              <div className="p-4">
                <p className="text-xs font-semibold text-white mb-3 capitalize">
                  {new Date(year, month, selected).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {selectedTasks.length === 0 ? (
                  <p className="text-xs text-[#334155]">Sin tareas para este día</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map(t => (
                      <div key={t.id} className="flex items-start gap-2 p-2 bg-[#080f1e] rounded-xl border border-[#1e2f4a]">
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[t.priority])}/>
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate">{t.title}</p>
                          {t.projects && <p className="text-[10px] text-[#334155] mt-0.5">{t.projects.name}</p>}
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
            <p className="text-[9px] font-semibold text-[#1e3a5f] uppercase tracking-widest mb-3">Próximas tareas</p>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CalendarDays size={20} className="text-[#1e2f4a]"/>
                <p className="text-xs text-[#334155] text-center">Sin tareas próximas</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcoming.map(t => {
                  const d = new Date(t.due_date)
                  const isOverdue = d < new Date()
                  return (
                    <div key={t.id} className="flex items-center gap-2 py-2 border-b border-[#1e2f4a]/30 last:border-0">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[t.priority])}/>
                      <p className="text-xs text-[#94a3b8] truncate flex-1">{t.title}</p>
                      <span className={cn('text-[10px] shrink-0', isOverdue ? 'text-red-400' : 'text-[#334155]')}>
                        {d.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
