'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelative, formatNumber } from '@/lib/utils'
import { Users, FolderKanban, Clock, CheckCircle2, RefreshCw } from 'lucide-react'

interface DashboardData {
  stats: { totalClients: number; activeProjects: number; pendingActions: number; workflowSuccessRate: number }
  recentActions: Array<{ id: string; action_type: string; description: string; status: string; created_by: string; created_at: string }>
  metrics: { instagram_followers: number | null; instagram_engagement: number | null; youtube_subscribers: number | null; youtube_views: number | null; tiktok_followers: number | null; tiktok_engagement: number | null } | null
}

const TYPE_ICONS: Record<string, string> = { email: '✉', api_call: '⚡', ssh: '💻', report: '📊', decision: '◈', other: '·' }

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
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] flex items-center justify-center shadow-[0_0_20px_rgba(255,140,66,.4)] animate-pulse">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
        </div>
        <p className="text-[#334155] text-xs tracking-widest uppercase">Cargando</p>
      </div>
    </div>
  )

  const { stats, recentActions, metrics } = data!

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Vista general de Nova Agency"
        actions={
          <button onClick={load} disabled={spinning} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#111e33] hover:bg-[#1a2d4a] text-[#64748b] hover:text-white border border-[#1e2f4a] hover:border-[#2a4166] rounded-xl transition-all">
            <RefreshCw size={12} className={spinning ? 'animate-spin' : ''} />
            Actualizar
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-grid">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Clientes" value={stats.totalClients}
            icon={<Users size={16}/>} color="orange" sub="activos" />
          <StatCard label="Proyectos" value={stats.activeProjects}
            icon={<FolderKanban size={16}/>} color="purple" sub="en curso" />
          <StatCard label="Pendientes" value={stats.pendingActions}
            icon={<Clock size={16}/>} color="blue" sub="acciones" />
          <StatCard label="Workflows" value={`${stats.workflowSuccessRate}%`}
            icon={<CheckCircle2 size={16}/>} color="green" sub="tasa de éxito" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Métricas sociales */}
          <div className="lg:col-span-2 bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#1e2f4a] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Métricas</h3>
              <a href="/metrics" className="text-[10px] text-[#ff8c42] hover:text-[#ffaa66] uppercase tracking-widest transition-colors">Ver todo →</a>
            </div>

            <div className="p-4 space-y-2">
              {/* Instagram */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080f1e] border border-[#1e2f4a] hover:border-[#2a4166] transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,.3)] text-white text-xs font-bold">
                  IG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#475569]">Instagram</p>
                  <p className="text-sm font-bold text-white">
                    {metrics?.instagram_followers ? formatNumber(metrics.instagram_followers) : '—'}
                  </p>
                </div>
                {metrics?.instagram_engagement && (
                  <span className="text-xs text-green-400 font-medium">{metrics.instagram_engagement}%</span>
                )}
              </div>

              {/* YouTube */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080f1e] border border-[#1e2f4a] hover:border-[#2a4166] transition-all">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(220,38,38,.3)] text-white text-xs font-bold">
                  YT
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#475569]">YouTube</p>
                  <p className="text-sm font-bold text-white">
                    {metrics?.youtube_subscribers ? formatNumber(metrics.youtube_subscribers) : '—'}
                  </p>
                </div>
                {metrics?.youtube_views && (
                  <span className="text-xs text-[#475569]">{formatNumber(metrics.youtube_views)} vistas</span>
                )}
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080f1e] border border-[#1e2f4a] hover:border-[#2a4166] transition-all">
                <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center shrink-0 border border-white/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#475569]">TikTok</p>
                  <p className="text-sm font-bold text-white">
                    {metrics?.tiktok_followers ? formatNumber(metrics.tiktok_followers) : '—'}
                  </p>
                </div>
                {metrics?.tiktok_engagement && (
                  <span className="text-xs text-green-400 font-medium">{metrics.tiktok_engagement}%</span>
                )}
              </div>

              {!metrics && (
                <p className="text-xs text-[#334155] text-center py-2">Sin datos — <a href="/metrics" className="text-[#ff8c42] hover:underline">cargar métricas</a></p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-3 bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2f4a] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Actividad reciente</h3>
              <a href="/audit" className="text-[10px] text-[#ff8c42] hover:text-[#ffaa66] uppercase tracking-widest transition-colors">Audit log →</a>
            </div>

            <div className="divide-y divide-[#1e2f4a]/60">
              {recentActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1e2f4a] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  </div>
                  <p className="text-xs text-[#334155]">Sin actividad registrada</p>
                </div>
              ) : recentActions.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[.015] transition-colors">
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-[#080f1e] border border-[#1e2f4a] flex items-center justify-center text-xs shrink-0">
                    {TYPE_ICONS[a.action_type] || '·'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#94a3b8] truncate">{a.description}</p>
                    <p className="text-[11px] text-[#334155] mt-0.5">{a.created_by} · {formatRelative(a.created_at)}</p>
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
