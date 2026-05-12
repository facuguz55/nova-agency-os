'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Square, FolderKanban, Users, Zap, Flag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Task { id: string; title: string; priority: string; status: string; due_date: string | null; assigned_to: string | null }
interface Stats { totalClients: number; activeProjects: number; pendingActions: number }

const PRIORITY_COLOR: Record<string, string> = { urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-[#4a6080]' }
const PRIORITY_DOT:   Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-[#334155]' }

export default function MobileHomePage() {
  const [tasks, setTasks]   = useState<Task[]>([])
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  async function load() {
    const [tRes, dRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/dashboard')])
    const [tData, dData] = await Promise.all([tRes.json(), dRes.json()])
    setTasks(tData.tasks || [])
    setStats(dData.stats || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleTask(t: Task) {
    const newStatus = t.status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x))
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const pending  = tasks.filter(t => t.status !== 'done')
  const urgent   = pending.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 4)
  const todayStr = new Date().toISOString().slice(0, 10)
  const dueToday = pending.filter(t => t.due_date === todayStr)

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      {/* Header */}
      <header className="shrink-0 px-5 border-b border-[#1a2d45] bg-[#0c1628]"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 16px)`, paddingBottom: '16px' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#4a6080]">{greeting}</p>
            <p className="text-lg font-bold text-white leading-tight">Nova Agency</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
              <circle cx="10" cy="13" r="2.2" fill="white"/>
            </svg>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 space-y-5">

        {/* Stats rápidas */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, label: 'Clientes', value: stats.totalClients, color: 'text-[#f97316]', bg: 'bg-[#f97316]/10' },
              { icon: FolderKanban, label: 'Proyectos', value: stats.activeProjects, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { icon: Zap, label: 'Pendientes', value: stats.pendingActions, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-3 flex flex-col items-center gap-1.5">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                  <Icon size={15} className={color} />
                </div>
                <p className="text-lg font-bold text-white leading-none">{value}</p>
                <p className="text-[10px] text-[#4a6080]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Vencen hoy */}
        {dueToday.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Flag size={14} className="text-orange-400 shrink-0" />
            <p className="text-sm text-orange-300">
              <span className="font-semibold">{dueToday.length} tarea{dueToday.length > 1 ? 's' : ''}</span> vence{dueToday.length > 1 ? 'n' : ''} hoy
            </p>
          </div>
        )}

        {/* Tareas urgentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Foco de hoy</p>
            <Link href="/m/tareas" className="text-[11px] text-[#f97316] flex items-center gap-0.5">
              Ver todas <ArrowRight size={10} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
            </div>
          ) : urgent.length === 0 ? (
            <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-6 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckSquare size={18} className="text-emerald-400" />
              </div>
              <p className="text-sm text-[#64748b]">Sin tareas urgentes 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgent.map(t => (
                <div key={t.id} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex items-start gap-3 active:bg-[#152338] transition-colors">
                  <button onClick={() => toggleTask(t)} className="shrink-0 mt-0.5">
                    {t.status === 'done'
                      ? <CheckSquare size={18} className="text-[#f97316]" />
                      : <Square size={18} className="text-[#334155]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium leading-snug', t.status === 'done' ? 'text-[#334155] line-through' : 'text-white')}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[t.priority])} />
                      <span className={cn('text-[10px] font-bold uppercase', PRIORITY_COLOR[t.priority])}>{t.priority}</span>
                      {t.due_date && (
                        <span className="text-[10px] text-[#4a6080]">
                          {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {t.assigned_to && <span className="text-[10px] text-[#4a6080] truncate">{t.assigned_to}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/m/chat',      label: 'IA Chat',    desc: 'Hablar con Nova',   emoji: '🤖' },
              { href: '/m/tareas',    label: 'Tareas',     desc: `${pending.length} pendientes`, emoji: '✓' },
              { href: '/m/proyectos', label: 'Proyectos',  desc: 'Ver estado actual', emoji: '📁' },
              { href: '/m/notas',     label: 'Notas',      desc: 'Grabación de voz',  emoji: '🎙️' },
            ].map(({ href, label, desc, emoji }) => (
              <Link key={href} href={href}
                className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex flex-col gap-2 active:bg-[#152338] transition-colors">
                <span className="text-xl">{emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-[#4a6080]">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
