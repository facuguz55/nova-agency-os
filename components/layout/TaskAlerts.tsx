'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, AlertCircle, Clock, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string; title: string; due_date: string | null; status: string
}

interface TaskAlertsProps { collapsed: boolean }

export default function TaskAlerts({ collapsed }: TaskAlertsProps) {
  const [overdue, setOverdue] = useState<Task[]>([])
  const [today,   setToday]   = useState<Task[]>([])
  const [soon,    setSoon]    = useState<Task[]>([])
  const [open,    setOpen]    = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res  = await fetch('/api/tasks')
        const data = await res.json()
        const tasks: Task[] = data.tasks || []

        const now       = new Date()
        const todayStr  = now.toISOString().slice(0, 10)
        const in7       = new Date(now.getTime() + 7 * 86400000)

        const pending = tasks.filter(t => t.status !== 'done' && t.due_date)

        setOverdue(pending.filter(t => t.due_date! < todayStr))
        setToday(pending.filter(t => t.due_date === todayStr))
        setSoon(pending.filter(t => {
          const d = t.due_date!
          return d > todayStr && new Date(d) <= in7
        }))
      } catch { /* silenciar errores de red */ }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const urgentCount = overdue.length + today.length
  const hasAny      = urgentCount > 0 || soon.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title={collapsed ? 'Alertas de tareas' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-xl text-sm text-[var(--text-4)]',
          'hover:bg-[var(--amber-dim)] hover:text-[var(--amber)] transition-all w-full group',
          collapsed ? 'px-0 py-3 justify-center' : 'px-3 py-2.5',
        )}
      >
        <div className="relative shrink-0">
          <Bell size={15} />
          {urgentCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 leading-none shadow-[0_0_6px_rgba(239,68,68,.6)]">
              {urgentCount > 9 ? '9+' : urgentCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            <span className="font-medium">Alertas</span>
            {urgentCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 leading-none">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute left-full bottom-0 ml-2 z-[100] w-72 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.7)] overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold text-white">Recordatorios</p>
            <button onClick={() => setOpen(false)} className="text-[var(--text-4)] hover:text-white text-xs">✕</button>
          </div>

          {!hasAny ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Bell size={20} className="text-[var(--border)]" />
              <p className="text-xs text-[var(--text-4)]">Sin alertas pendientes</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {overdue.length > 0 && (
                <div className="p-3 bg-red-500/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle size={11} className="text-red-400" />
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Vencidas · {overdue.length}</p>
                  </div>
                  <div className="space-y-1">
                    {overdue.map(t => (
                      <Link key={t.id} href="/tasks" onClick={() => setOpen(false)}
                        className="flex items-center justify-between hover:bg-red-500/10 rounded-lg px-2 py-1.5 transition-colors group">
                        <span className="text-xs text-[var(--text-2)] group-hover:text-white truncate pr-2">{t.title}</span>
                        <span className="text-[10px] text-red-400 shrink-0">{t.due_date}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {today.length > 0 && (
                <div className="p-3 bg-orange-500/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={11} className="text-orange-400" />
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest">Hoy · {today.length}</p>
                  </div>
                  <div className="space-y-1">
                    {today.map(t => (
                      <Link key={t.id} href="/tasks" onClick={() => setOpen(false)}
                        className="flex items-center justify-between hover:bg-orange-500/10 rounded-lg px-2 py-1.5 transition-colors group">
                        <span className="text-xs text-[var(--text-2)] group-hover:text-white truncate">{t.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {soon.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays size={11} className="text-[var(--text-3)]" />
                    <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-widest">Próx. 7 días · {soon.length}</p>
                  </div>
                  <div className="space-y-1">
                    {soon.map(t => (
                      <Link key={t.id} href="/tasks" onClick={() => setOpen(false)}
                        className="flex items-center justify-between hover:bg-white/[.03] rounded-lg px-2 py-1.5 transition-colors group">
                        <span className="text-xs text-[var(--text-2)] group-hover:text-white truncate pr-2">{t.title}</span>
                        <span className="text-[10px] text-[var(--text-3)] shrink-0">{t.due_date}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
            <Link href="/tasks" onClick={() => setOpen(false)} className="text-[11px] text-[var(--text-3)] hover:text-[var(--amber)] transition-colors font-medium">
              Ver todas las tareas →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
