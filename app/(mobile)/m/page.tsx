'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Square, FolderKanban, Users, Zap, ArrowRight, Flag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Task { id: string; title: string; priority: string; status: string; due_date: string | null; assigned_to: string | null }
interface Stats { totalClients: number; activeProjects: number; pendingActions: number }

const PRIO_DOT: Record<string, string> = {
  urgent: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#334155',
}

export default function MobileHomePage() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const dayStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  async function load() {
    const [tRes, dRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/dashboard')])
    const [tData, dData] = await Promise.all([tRes.json(), dRes.json()])
    setTasks(tData.tasks || [])
    setStats(dData.stats || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleTask(t: Task) {
    const next = t.status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }

  const pending  = tasks.filter(t => t.status !== 'done')
  const urgent   = pending.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 4)
  const todayStr = new Date().toISOString().slice(0, 10)
  const dueToday = pending.filter(t => t.due_date === todayStr)

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'none' }}>

      {/* Header */}
      <header
        className="shrink-0 px-5"
        style={{
          paddingTop: `calc(env(safe-area-inset-top) + 20px)`,
          paddingBottom: '16px',
          background: 'linear-gradient(180deg, #07101f 0%, rgba(7,16,31,0) 100%)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase mobile-title" style={{ color: 'rgba(249,115,22,0.7)' }}>
              {greeting}
            </p>
            <p className="mobile-title text-white font-bold leading-tight mt-0.5" style={{ fontSize: 22 }}>
              Nova Agency
            </p>
            <p className="text-[10px] capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{dayStr}</p>
          </div>
          <Image
            src="/logo-nova-dark.png"
            alt="Nova Agency"
            width={40}
            height={40}
            className="object-contain rounded-2xl shrink-0"
          />
        </div>
      </header>

      <div className="flex-1 px-4 space-y-5 pb-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { Icon: Users,       label: 'Clientes',   value: stats.totalClients,   accent: '#f97316', bg: 'rgba(249,115,22,0.1)' },
              { Icon: FolderKanban,label: 'Proyectos',  value: stats.activeProjects, accent: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
              { Icon: Zap,         label: 'Pendientes', value: stats.pendingActions, accent: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
            ].map(({ Icon, label, value, accent, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-3.5 flex flex-col items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={15} style={{ color: accent }} />
                </div>
                <p className="mobile-mono text-white font-medium leading-none" style={{ fontSize: 20 }}>{value}</p>
                <p className="mobile-title text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Alerta vencen hoy */}
        {dueToday.length > 0 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
          >
            <Flag size={13} style={{ color: '#fb923c', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: 'rgba(251,146,60,0.9)' }}>
              <span className="font-bold">{dueToday.length} tarea{dueToday.length > 1 ? 's' : ''}</span>
              {' '}vence{dueToday.length > 1 ? 'n' : ''} hoy
            </p>
          </div>
        )}

        {/* Foco del día */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <p className="mobile-title text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Foco de hoy
            </p>
            <Link href="/m/tareas" className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#f97316' }}>
              Ver todas <ArrowRight size={10} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : urgent.length === 0 ? (
            <div
              className="rounded-2xl p-6 flex flex-col items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <CheckSquare size={18} style={{ color: '#4ade80' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Sin urgentes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgent.map(t => (
                <div
                  key={t.id}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <button
                    onClick={() => toggleTask(t)}
                    className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                    style={{
                      border: t.status === 'done' ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                      background: t.status === 'done' ? '#f97316' : 'transparent',
                    }}
                  >
                    {t.status === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium leading-snug',
                      t.status === 'done' ? 'line-through' : 'text-white/90'
                    )} style={{ color: t.status === 'done' ? 'rgba(255,255,255,0.25)' : undefined }}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: PRIO_DOT[t.priority] || '#334155' }} />
                      <span className="mobile-title text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: PRIO_DOT[t.priority] || '#334155', opacity: 0.8 }}>
                        {t.priority}
                      </span>
                      {t.due_date && (
                        <span className="mobile-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div>
          <p className="mobile-title text-[10px] font-bold uppercase tracking-widest mb-3 px-0.5"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Accesos rápidos
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: '/m/chat',      label: 'Chat IA',   desc: 'Hablar con Nova',       icon: '⚡', accent: '#a78bfa' },
              { href: '/m/tareas',    label: 'Tareas',    desc: `${pending.length} pendientes`, icon: '✓', accent: '#4ade80' },
              { href: '/m/proyectos', label: 'Proyectos', desc: 'Ver estado',             icon: '◈', accent: '#38bdf8' },
              { href: '/m/notas',     label: 'Notas',     desc: 'Grabación de voz',       icon: '●', accent: '#fb923c' },
            ].map(({ href, label, desc, icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[.97]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-lg font-bold" style={{ color: accent }}>{icon}</span>
                <div>
                  <p className="mobile-title text-sm font-bold text-white/90">{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
