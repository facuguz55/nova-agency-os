'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelative, cn } from '@/lib/utils'
import { Users, FolderKanban, Clock, CheckCircle2, RefreshCw, Flag, ArrowRight, Calendar } from 'lucide-react'

interface UrgentTask {
  id: string; title: string; priority: 'urgent' | 'high'
  status: string; due_date: string | null; assigned_to: string | null
}

interface DashboardData {
  stats: { totalClients: number; activeProjects: number; pendingActions: number; workflowSuccessRate: number }
  recentActions: Array<{ id: string; action_type: string; description: string; status: string; created_by: string; created_at: string }>
  urgentTasks: UrgentTask[]
}

const TYPE_ICONS: Record<string, string> = { email: '✉', api_call: '⚡', ssh: '💻', report: '📊', decision: '◈', other: '·' }

const PRIORITY_RING: Record<string, string> = {
  urgent: 'border-red-500/40 bg-red-500/5',
  high:   'border-orange-500/30 bg-orange-500/5',
}
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
}
const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgente', high: 'Alta' }

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)

  async function load() {
    setSpinning(true); setLoading(!data)
    const res = await fetch('/api/dashboard')
    setData(await res.json())
    setLoading(false); setSpinning(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center animate-pulse">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[#4a6080] text-xs tracking-widest uppercase">Cargando</p>
      </div>
    </div>
  )

  const { stats, recentActions, urgentTasks } = data!

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Vista general de Nova Agency"
        actions={
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0f1d30] hover:bg-[#152338] text-[#64748b] hover:text-[#94a3b8] border border-[#1a2d45] hover:border-[#253f60] rounded-lg transition-colors"
          >
            <RefreshCw size={11} className={spinning ? 'animate-spin' : ''} />
            Actualizar
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Clientes"   value={stats.totalClients}               icon={<Users size={15}/>}        color="orange" sub="activos" />
          <StatCard label="Proyectos"  value={stats.activeProjects}              icon={<FolderKanban size={15}/>} color="purple" sub="en curso" />
          <StatCard label="Pendientes" value={stats.pendingActions}              icon={<Clock size={15}/>}        color="blue"   sub="acciones" />
          <StatCard label="Workflows"  value={`${stats.workflowSuccessRate}%`}   icon={<CheckCircle2 size={15}/>} color="green"  sub="tasa de éxito" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Tareas urgentes */}
          <div className="lg:col-span-2 bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#1a2d45] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Flag size={12} className="text-red-400" />
                <h3 className="text-xs font-semibold text-[#64748b]">Foco del día</h3>
              </div>
              <Link href="/tasks" className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors flex items-center gap-0.5">
                Ver tareas <ArrowRight size={10} />
              </Link>
            </div>

            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {urgentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-xs text-[#334155]">Sin tareas urgentes</p>
                </div>
              ) : urgentTasks.map(task => (
                <div
                  key={task.id}
                  className={cn('flex items-start gap-3 p-3 rounded-lg border transition-colors', PRIORITY_RING[task.priority])}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[task.priority])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-snug truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-[10px] font-bold uppercase', task.priority === 'urgent' ? 'text-red-400' : 'text-orange-400')}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-[#4a6080] flex items-center gap-0.5">
                          <Calendar size={9} /> {new Date(task.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="text-[10px] text-[#4a6080] truncate">{task.assigned_to}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="lg:col-span-3 bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#1a2d45] flex items-center justify-between shrink-0">
              <h3 className="text-xs font-semibold text-[#64748b]">Actividad reciente</h3>
              <Link href="/audit" className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors flex items-center gap-0.5">
                Audit log <ArrowRight size={10} />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-[#1a2d45] overflow-y-auto">
              {recentActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1a2d45] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                  <p className="text-xs text-[#334155]">Sin actividad registrada</p>
                </div>
              ) : recentActions.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[.015] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#1a2d45] flex items-center justify-center text-xs shrink-0 text-[#64748b]">
                    {TYPE_ICONS[a.action_type] || '·'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#94a3b8] truncate">{a.description}</p>
                    <p className="text-[11px] text-[#4a6080] mt-0.5">{a.created_by} · {formatRelative(a.created_at)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
