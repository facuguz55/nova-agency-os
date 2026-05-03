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
        <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center animate-pulse">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[#4a6080] text-xs tracking-widest uppercase">Cargando</p>
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

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Clientes"   value={stats.totalClients}          icon={<Users size={15}/>}        color="orange" sub="activos" />
          <StatCard label="Proyectos"  value={stats.activeProjects}         icon={<FolderKanban size={15}/>} color="purple" sub="en curso" />
          <StatCard label="Pendientes" value={stats.pendingActions}         icon={<Clock size={15}/>}        color="blue"   sub="acciones" />
          <StatCard label="Workflows"  value={`${stats.workflowSuccessRate}%`} icon={<CheckCircle2 size={15}/>} color="green"  sub="tasa de éxito" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Métricas sociales */}
          <div className="lg:col-span-2 bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#64748b]">Métricas sociales</h3>
              <a href="/metrics" className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors">Ver todo →</a>
            </div>

            <div className="p-4 space-y-2">
              {/* Instagram */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#080f1e] border border-[#1a2d45] hover:border-[#253f60] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  IG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#4a6080]">Instagram</p>
                  <p className="text-sm font-semibold text-white">
                    {metrics?.instagram_followers ? formatNumber(metrics.instagram_followers) : '—'}
                  </p>
                </div>
                {metrics?.instagram_engagement && (
                  <span className="text-xs text-emerald-400 font-medium">{metrics.instagram_engagement}%</span>
                )}
              </div>

              {/* YouTube */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#080f1e] border border-[#1a2d45] hover:border-[#253f60] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  YT
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#4a6080]">YouTube</p>
                  <p className="text-sm font-semibold text-white">
                    {metrics?.youtube_subscribers ? formatNumber(metrics.youtube_subscribers) : '—'}
                  </p>
                </div>
                {metrics?.youtube_views && (
                  <span className="text-xs text-[#4a6080]">{formatNumber(metrics.youtube_views)} vistas</span>
                )}
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#080f1e] border border-[#1a2d45] hover:border-[#253f60] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center shrink-0 border border-white/10">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#4a6080]">TikTok</p>
                  <p className="text-sm font-semibold text-white">
                    {metrics?.tiktok_followers ? formatNumber(metrics.tiktok_followers) : '—'}
                  </p>
                </div>
                {metrics?.tiktok_engagement && (
                  <span className="text-xs text-emerald-400 font-medium">{metrics.tiktok_engagement}%</span>
                )}
              </div>

              {!metrics && (
                <p className="text-xs text-[#334155] text-center py-3">
                  Sin datos — <a href="/metrics" className="text-[#f97316] hover:underline">cargar métricas</a>
                </p>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="lg:col-span-3 bg-[#0f1d30] border border-[#1a2d45] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#64748b]">Actividad reciente</h3>
              <a href="/audit" className="text-[11px] text-[#f97316] hover:text-[#fb923c] transition-colors">Audit log →</a>
            </div>

            <div className="divide-y divide-[#1a2d45]">
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
