'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelative, cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Legend,
} from 'recharts'
import {
  Users, FolderKanban, Clock, CheckCircle2, RefreshCw,
  Flag, ArrowRight, Calendar, AlertTriangle, TrendingUp, Zap,
  DollarSign, Activity,
} from 'lucide-react'

interface UrgentTask {
  id: string; title: string; priority: 'urgent' | 'high'
  status: string; due_date: string | null; assigned_to: string | null
}
interface ColdClient { id: string; name: string; updated_at: string | null }

interface DashboardData {
  stats: {
    totalClients: number; activeProjects: number; pendingActions: number
    workflowSuccessRate: number
  }
  revenue: {
    thisMonth: number; lastMonth: number; pending: number; total6m: number
  }
  recentActions: Array<{ id: string; action_type: string; description: string; status: string; created_by: string; created_at: string }>
  urgentTasks: UrgentTask[]
  coldClients: ColdClient[]
  revenueChart: Array<{ month: string; total: number }>
  projectsChart: Array<{ status: string; count: number }>
  tasksChart: Array<{ priority: string; count: number }>
}

const TYPE_ICONS: Record<string, string> = { email: '✉', api_call: '⚡', ssh: '💻', report: '📊', decision: '◈', other: '·' }

const PRIORITY_RING: Record<string, string> = {
  urgent: 'border-red-500/25 bg-red-500/5',
  high:   'border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)]',
}
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-[#f59e0b]',
}
const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgente', high: 'Alta' }

const PROJECT_COLOR: Record<string, string> = {
  active:    '#10b981',
  planning:  '#3b82f6',
  completed: '#444',
  paused:    '#f59e0b',
}
const PROJECT_LABEL: Record<string, string> = {
  active: 'Activo', planning: 'Planning', completed: 'Completado', paused: 'Pausado'
}

const PRIORITY_COLOR_BAR: Record<string, string> = {
  urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#333'
}
const PRIORITY_LABEL_SHORT: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja'
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function TooltipRevenue({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-[var(--text-3)] mb-0.5">{label}</p>
      <p className="text-[#f59e0b] font-bold">${payload[0].value.toLocaleString('es-AR')}</p>
    </div>
  )
}

function TooltipArea({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-[var(--text-3)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

const RADAR_LABELS: Record<string, string> = {
  workflows: 'Workflows',
  clientes:  'Clientes',
  proyectos: 'Proyectos',
  tareas:    'Tareas',
  acciones:  'Acciones',
}

export default function DashboardPage() {
  usePageTitle('Dashboard')
  const [data, setData]         = useState<DashboardData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [userName, setUserName] = useState('Facundo')

  async function load() {
    setSpinning(true); setLoading(!data)
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false); setSpinning(false)
  }

  useEffect(() => {
    load()
    // Obtener nombre de usuario
    const n = localStorage.getItem('nova_display_name')
    if (n) setUserName(n)
  }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center animate-pulse">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,18 1,18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[var(--text-3)] text-[11px] tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>Cargando</p>
      </div>
    </div>
  )

  const { stats, recentActions, urgentTasks, coldClients, revenueChart, projectsChart, tasksChart, revenue } = data!

  const healthScore = Math.max(0, Math.min(100, Math.round(
    60
    + (stats.workflowSuccessRate >= 80 ? 15 : stats.workflowSuccessRate >= 50 ? 5 : -5)
    + (urgentTasks.length === 0 ? 10 : urgentTasks.length <= 2 ? 5 : -10)
    + (coldClients.length === 0 ? 10 : coldClients.length <= 2 ? 0 : -15)
    + (stats.activeProjects > 0 ? 5 : 0)
  )))
  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 55 ? '#f59e0b' : '#ef4444'
  const healthLabel = healthScore >= 80 ? 'Excelente' : healthScore >= 55 ? 'Atención' : 'Crítico'

  // Radar data
  const radarData = [
    { subject: 'Workflows', A: stats.workflowSuccessRate },
    { subject: 'Clientes',  A: Math.min(100, stats.totalClients * 10) },
    { subject: 'Proyectos', A: Math.min(100, stats.activeProjects * 20) },
    { subject: 'Tareas',    A: Math.max(0, 100 - urgentTasks.length * 15) },
    { subject: 'Acciones',  A: Math.max(0, 100 - stats.pendingActions * 10) },
  ]

  // Tarea completadas esta semana (mock basado en tasksChart)
  const totalTasks = tasksChart.reduce((s, t) => s + t.count, 0)

  const revThisMonth = revenue?.thisMonth ?? 0
  const revPending   = revenue?.pending ?? 0

  const dayOfWeek = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const today = new Date().getDay()
  const activityData = dayOfWeek.map((d, i) => ({
    day: d,
    tasks: i === today ? Math.max(urgentTasks.length, 1) : Math.floor(Math.random() * 4),
    active: i === today,
  }))

  return (
    <>
      <Header title="Dashboard" subtitle={todayLabel()} actions={
        <button
          onClick={load}
          disabled={spinning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-white/[.04] hover:bg-white/[.07] text-[var(--text-3)] hover:text-[var(--text-2)] border border-[rgba(255,255,255,0.08)] rounded-lg transition-all"
        >
          <RefreshCw size={11} className={spinning ? 'animate-spin' : ''} />
          Actualizar
        </button>
      } />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* ─── HERO BANNER ─────────────────────────────────── */}
        <div className="animate-fade-up bg-[#0f0f0f] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
          {/* Subtle amber glow */}
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[rgba(245,158,11,0.06)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 right-32 w-48 h-48 rounded-full bg-[rgba(59,130,246,0.04)] blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[12px] text-[var(--text-3)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {todayLabel().charAt(0).toUpperCase() + todayLabel().slice(1)}
            </p>
            <h2 className="text-[28px] font-800 text-white leading-none mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {greeting()}, {userName}
            </h2>
            <p className="text-[13px] text-[var(--amber)] font-medium mt-1">
              {urgentTasks.length > 0
                ? `${urgentTasks.length} tarea${urgentTasks.length > 1 ? 's' : ''} urgente${urgentTasks.length > 1 ? 's' : ''} para hoy`
                : 'Todo en orden — sin urgentes 🎯'}
            </p>
            <div className="flex items-center gap-5 mt-4">
              <div>
                <p className="text-[11px] text-[var(--text-3)]">Proyectos activos</p>
                <p className="text-[20px] font-700 text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.activeProjects}</p>
              </div>
              <div className="w-px h-8 bg-[rgba(255,255,255,0.07)]" />
              <div>
                <p className="text-[11px] text-[var(--text-3)]">Clientes</p>
                <p className="text-[20px] font-700 text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalClients}</p>
              </div>
              <div className="w-px h-8 bg-[rgba(255,255,255,0.07)]" />
              <div>
                <p className="text-[11px] text-[var(--text-3)]">Workflows</p>
                <p className="text-[20px] font-700 text-white" style={{ fontFamily: 'var(--font-display)' }}>{stats.workflowSuccessRate}%</p>
              </div>
            </div>
          </div>

          {/* Health ring */}
          <div className="relative w-24 h-24 shrink-0 animate-float">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={healthColor} strokeWidth="3"
                strokeDasharray={`${healthScore} 100`} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${healthColor}80)` }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-800 text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>{healthScore}</span>
              <span className="text-[9px] text-[var(--text-3)] uppercase tracking-wider mt-0.5">Salud</span>
            </div>
          </div>
        </div>

        {/* ─── STATS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Clientes"   value={stats.totalClients}             icon={<Users size={14}/>}         color="blue"   sub="activos"        animDelay="0.05s" />
          <StatCard label="Proyectos"  value={stats.activeProjects}            icon={<FolderKanban size={14}/>}  color="purple" sub="en curso"        animDelay="0.10s" />
          <StatCard label="Pendientes" value={stats.pendingActions}            icon={<Clock size={14}/>}         color="amber"  sub="acciones"        animDelay="0.15s" />
          <StatCard label="Workflows"  value={`${stats.workflowSuccessRate}%`} icon={<CheckCircle2 size={14}/>}  color="green"  sub="tasa de éxito"   animDelay="0.20s" />
        </div>

        {/* ─── REVENUE CARDS ──────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 animate-fade-up stagger-3">
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-[var(--amber)]" />
              <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Cobrado este mes</p>
            </div>
            <p className="text-[26px] font-bold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              ${revThisMonth.toLocaleString('es-AR')}
            </p>
            <p className="text-[11px] text-[var(--text-3)] mt-1.5">Facturas pagadas en junio</p>
          </div>

          <div className="bg-[#111] border border-[rgba(245,158,11,0.12)] rounded-2xl p-5 col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-[var(--amber)]" />
              <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Pendiente de cobro</p>
            </div>
            <p className="text-[26px] font-bold text-[var(--amber)] leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              ${revPending.toLocaleString('es-AR')}
            </p>
            <p className="text-[11px] text-[var(--text-3)] mt-1.5">Facturas emitidas sin cobrar</p>
          </div>

          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Ingresos últimos 6 meses</p>
              <span className="text-[10px] text-[var(--text-4)] bg-white/5 border border-[rgba(255,255,255,0.07)] px-2 py-0.5 rounded-lg">Total: ${(revenue?.total6m ?? 0).toLocaleString('es-AR')}</span>
            </div>
            <ResponsiveContainer width="100%" height={56}>
              <AreaChart data={revenueChart} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<TooltipRevenue />} cursor={false} />
                <Area dataKey="total" stroke="#f59e0b" strokeWidth={1.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── MAIN CHARTS ROW ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-4">

          {/* Revenue bars */}
          <div className="lg:col-span-2 bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>Facturación mensual</p>
                <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  ${(revenue?.total6m ?? 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[11px] text-[var(--text-3)]">Cobrado en 6 meses</p>
              </div>
              <TrendingUp size={16} className="text-[var(--text-4)]" />
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={revenueChart} barSize={24} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<TooltipRevenue />} cursor={{ fill: 'rgba(245,158,11,0.04)' }} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {revenueChart?.map((entry, i) => (
                    <Cell key={i} fill={entry.total > 0 ? '#f59e0b' : 'rgba(255,255,255,0.06)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 flex flex-col">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-display)' }}>Rendimiento general</p>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 10 }} />
                  <Radar name="Score" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── MINI CHARTS ROW ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up stagger-5">

          {/* Proyectos por estado */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-display)' }}>Proyectos</p>
            <div className="space-y-2">
              {(projectsChart || []).map(p => (
                <div key={p.status} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PROJECT_COLOR[p.status] ?? '#333' }} />
                  <p className="text-[12px] text-[var(--text-3)] flex-1">{PROJECT_LABEL[p.status] || p.status}</p>
                  <span className="text-[12px] font-bold text-white">{p.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tareas por prioridad */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-display)' }}>Tareas pendientes</p>
            <div className="space-y-2">
              {(tasksChart || []).map(t => (
                <div key={t.priority} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR_BAR[t.priority] }} />
                  <p className="text-[12px] text-[var(--text-3)] flex-1">{PRIORITY_LABEL_SHORT[t.priority] || t.priority}</p>
                  <span className="text-[12px] font-bold text-white">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad semanal (mock) */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-display)' }}>Actividad semanal</p>
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={activityData} barSize={14} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#444', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipArea />} cursor={false} />
                <Bar dataKey="tasks" radius={[4,4,0,0]}>
                  {activityData.map((entry, i) => (
                    <Cell key={i} fill={entry.active ? '#f59e0b' : 'rgba(255,255,255,0.08)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Salud del negocio */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4 flex flex-col">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-display)' }}>Salud del negocio</p>
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-14 h-14 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={healthColor} strokeWidth="3.5"
                    strokeDasharray={`${healthScore} 100`} strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${healthColor}90)` }}/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] font-800 text-white" style={{ fontFamily: 'var(--font-display)' }}>{healthScore}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${healthColor}18`, color: healthColor }}>
                  {healthLabel}
                </span>
                <p className="text-[10px] text-[var(--text-3)] mt-1.5">Urgentes: {urgentTasks.length}</p>
                <p className="text-[10px] text-[var(--text-3)]">Fríos: {coldClients.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CLIENTES FRÍOS ──────────────────────────────── */}
        {coldClients.length > 0 && (
          <div className="animate-fade-up stagger-6 bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.15)] rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle size={14} className="text-[var(--amber)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--amber)] mb-1.5">Clientes sin contacto — más de 14 días</p>
              <div className="flex flex-wrap gap-2">
                {coldClients.map(c => (
                  <Link key={c.id} href={`/clients/${c.id}`}
                    className="text-[12px] text-[var(--amber)]/70 hover:text-[var(--amber)] underline underline-offset-2 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── FOCO + ACTIVIDAD ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up stagger-7">

          {/* Foco del día */}
          <div className="lg:col-span-2 bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Flag size={12} className="text-red-400" />
                <h3 className="text-[12px] font-semibold text-[var(--text-2)]" style={{ fontFamily: 'var(--font-display)' }}>Foco del día</h3>
              </div>
              <Link href="/tasks" className="text-[11px] text-[var(--amber)] hover:text-[var(--amber-hi)] transition-colors flex items-center gap-0.5">
                Ver tareas <ArrowRight size={10} />
              </Link>
            </div>

            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {urgentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-[12px] text-[var(--text-3)]">Sin tareas urgentes</p>
                </div>
              ) : urgentTasks.map(task => (
                <div
                  key={task.id}
                  className={cn('flex items-start gap-3 p-3 rounded-xl border transition-all hover:border-opacity-40', PRIORITY_RING[task.priority])}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[task.priority])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-medium leading-snug truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-[10px] font-bold uppercase', task.priority === 'urgent' ? 'text-red-400' : 'text-[var(--amber)]')}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-[var(--text-3)] flex items-center gap-0.5">
                          <Calendar size={9} /> {new Date(task.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="lg:col-span-3 bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-[var(--text-3)]" />
                <h3 className="text-[12px] font-semibold text-[var(--text-2)]" style={{ fontFamily: 'var(--font-display)' }}>Actividad reciente</h3>
              </div>
              <Link href="/audit" className="text-[11px] text-[var(--amber)] hover:text-[var(--amber-hi)] transition-colors flex items-center gap-0.5">
                Audit log <ArrowRight size={10} />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-[rgba(255,255,255,0.05)] overflow-y-auto">
              {recentActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-[12px] text-[var(--text-3)]">Sin actividad registrada</p>
                </div>
              ) : recentActions.slice(0, 8).map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[.02] transition-colors"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[.04] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[12px] shrink-0 text-[var(--text-3)]">
                    {TYPE_ICONS[a.action_type] || '·'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--text-2)] truncate">{a.description}</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">{a.created_by} · {formatRelative(a.created_at)}</p>
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
