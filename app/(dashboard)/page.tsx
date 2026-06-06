'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelative, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, FolderKanban, Clock, CheckCircle2, RefreshCw, Flag, ArrowRight, Calendar, AlertTriangle } from 'lucide-react'

interface UrgentTask {
  id: string; title: string; priority: 'urgent' | 'high'
  status: string; due_date: string | null; assigned_to: string | null
}
interface ColdClient { id: string; name: string; updated_at: string | null }

interface DashboardData {
  stats: { totalClients: number; activeProjects: number; pendingActions: number; workflowSuccessRate: number }
  recentActions: Array<{ id: string; action_type: string; description: string; status: string; created_by: string; created_at: string }>
  urgentTasks: UrgentTask[]
  coldClients: ColdClient[]
  revenueChart: Array<{ month: string; total: number }>
  projectsChart: Array<{ status: string; count: number }>
  tasksChart: Array<{ priority: string; count: number }>
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

const PROJECT_COLOR: Record<string, string> = {
  active:    '#10b981',
  planning:  '#3b82f6',
  completed: '#475569',
  paused:    '#f59e0b',
}
const PROJECT_LABEL: Record<string, string> = {
  active: 'Activo', planning: 'Planning', completed: 'Completado', paused: 'Pausado'
}

const PRIORITY_COLOR_BAR: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#475569'
}
const PRIORITY_LABEL_SHORT: Record<string, string> = {
  urgent: 'Urg', high: 'Alta', medium: 'Med', low: 'Baja'
}

function TooltipRevenue({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0c1628] border border-[#1e3352] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[#64748b] mb-0.5">{label}</p>
      <p className="text-[#f97316] font-bold">${payload[0].value.toLocaleString('es-AR')}</p>
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Inicio')
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

  const { stats, recentActions, urgentTasks, coldClients, revenueChart, projectsChart, tasksChart } = data!

  const healthScore = Math.max(0, Math.min(100, Math.round(
    60
    + (stats.workflowSuccessRate >= 80 ? 15 : stats.workflowSuccessRate >= 50 ? 5 : -5)
    + (urgentTasks.length === 0 ? 10 : urgentTasks.length <= 2 ? 5 : -10)
    + (coldClients.length === 0 ? 10 : coldClients.length <= 2 ? 0 : -15)
    + (stats.activeProjects > 0 ? 5 : 0)
  )))
  const healthColor = healthScore >= 80 ? '#22c55e' : healthScore >= 55 ? '#f97316' : '#ef4444'
  const healthLabel = healthScore >= 80 ? 'Excelente' : healthScore >= 55 ? 'Atención' : 'Crítico'

  const totalRevenue = revenueChart?.reduce((s, r) => s + r.total, 0) || 0

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Vista general de Nova Agency"
        actions={
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0c1628] hover:bg-[#152338] text-[#64748b] hover:text-[#94a3b8] border border-[#1a2d45] hover:border-[#253f60] rounded-lg transition-colors"
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

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue bar chart */}
          <div className="lg:col-span-2 bg-[#0c1628] border border-[#152236] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest">Ingresos cobrados</p>
                <p className="text-2xl font-black text-white mt-0.5">${totalRevenue.toLocaleString('es-AR')}</p>
              </div>
              <span className="text-[11px] text-[#334155] bg-[#080f1e] border border-[#152236] px-2 py-1 rounded-lg">Últimos 6 meses</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={revenueChart} barSize={28} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<TooltipRevenue />} cursor={{ fill: 'rgba(249,115,22,0.04)' }} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {revenueChart?.map((entry, i) => (
                    <Cell key={i} fill={entry.total > 0 ? '#f97316' : '#152236'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Proyectos + Tareas */}
          <div className="flex flex-col gap-4">
            {/* Proyectos por estado */}
            <div className="flex-1 bg-[#0c1628] border border-[#152236] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3">Proyectos</p>
              <div className="space-y-2">
                {(projectsChart || []).map(p => (
                  <div key={p.status} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PROJECT_COLOR[p.status] }} />
                    <p className="text-xs text-[#64748b] flex-1">{PROJECT_LABEL[p.status] || p.status}</p>
                    <span className="text-xs font-bold text-white">{p.count}</span>
                    <div className="w-16 h-1.5 bg-[#152236] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.count * 20)}%`, background: PROJECT_COLOR[p.status] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tareas por prioridad */}
            <div className="flex-1 bg-[#0c1628] border border-[#152236] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3">Tareas pendientes</p>
              <div className="space-y-2">
                {(tasksChart || []).map(t => (
                  <div key={t.priority} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_COLOR_BAR[t.priority] }} />
                    <p className="text-xs text-[#64748b] flex-1">{PRIORITY_LABEL_SHORT[t.priority] || t.priority}</p>
                    <span className="text-xs font-bold text-white">{t.count}</span>
                    <div className="w-16 h-1.5 bg-[#152236] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, t.count * 15)}%`, background: PRIORITY_COLOR_BAR[t.priority] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de salud */}
        <div className="bg-[#0c1628] border border-[#152236] rounded-xl p-4 flex items-center gap-5">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#152236" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={healthColor} strokeWidth="3"
                strokeDasharray={`${healthScore} 100`} strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{healthScore}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">Salud del negocio</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${healthColor}20`, color: healthColor }}>{healthLabel}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-[#4a6080]">
              <span>Workflows: <b className="text-[#94a3b8]">{stats.workflowSuccessRate}%</b></span>
              <span>Tareas urgentes: <b className="text-[#94a3b8]">{urgentTasks.length}</b></span>
              <span>Clientes fríos: <b className="text-[#94a3b8]">{coldClients.length}</b></span>
              <span>Proyectos activos: <b className="text-[#94a3b8]">{stats.activeProjects}</b></span>
            </div>
          </div>
        </div>

        {/* Clientes fríos */}
        {coldClients.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-3.5 flex items-start gap-3">
            <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-yellow-400 mb-1">Clientes sin contacto — más de 14 días</p>
              <div className="flex flex-wrap gap-2">
                {coldClients.map(c => (
                  <Link key={c.id} href={`/clients/${c.id}`}
                    className="text-xs text-yellow-300/80 hover:text-yellow-300 underline underline-offset-2 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Tareas urgentes */}
          <div className="lg:col-span-2 bg-[#0c1628] border border-[#152236] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#152236] flex items-center justify-between shrink-0">
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
          <div className="lg:col-span-3 bg-[#0c1628] border border-[#152236] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#152236] flex items-center justify-between shrink-0">
              <h3 className="text-xs font-semibold text-[#64748b]">Actividad reciente</h3>
              <Link href="/audit" className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors flex items-center gap-0.5">
                Audit log <ArrowRight size={10} />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-[#152236] overflow-y-auto">
              {recentActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#152236] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                  <p className="text-xs text-[#334155]">Sin actividad registrada</p>
                </div>
              ) : recentActions.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[.015] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#152236] flex items-center justify-center text-xs shrink-0 text-[#64748b]">
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
