'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelative, formatNumber } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalClients: number
    activeProjects: number
    pendingActions: number
    workflowSuccessRate: number
  }
  recentActions: Array<{
    id: string
    action_type: string
    description: string
    status: string
    created_by: string
    created_at: string
  }>
  metrics: {
    instagram_followers: number | null
    instagram_engagement: number | null
    youtube_subscribers: number | null
    youtube_views: number | null
    tiktok_followers: number | null
    tiktok_engagement: number | null
  } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#475569] text-sm">Cargando...</div>
      </div>
    )
  }

  const { stats, recentActions, metrics } = data!

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Vista general de Nova Agency"
        actions={
          <button onClick={load} className="px-3 py-1.5 text-xs bg-[#334155] hover:bg-[#475569] text-white rounded-lg transition-colors">
            Actualizar
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Clientes activos" value={stats.totalClients} icon="◉" color="orange" />
          <StatCard label="Proyectos activos" value={stats.activeProjects} icon="◫" color="purple" />
          <StatCard label="Acciones pendientes" value={stats.pendingActions} icon="◒" color="blue" />
          <StatCard label="Workflows OK" value={`${stats.workflowSuccessRate}%`} icon="◎" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Métricas */}
          <div className="lg:col-span-1 bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-[#ff8c42]">◈</span> Métricas
              {!metrics && <span className="text-xs text-[#475569] font-normal">(sin datos)</span>}
            </h3>

            {metrics ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded text-xs flex items-center justify-center text-white font-bold">IG</span>
                    <span className="text-sm text-[#94a3b8]">Instagram</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {metrics.instagram_followers ? formatNumber(metrics.instagram_followers) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-red-500 rounded text-xs flex items-center justify-center text-white font-bold">YT</span>
                    <span className="text-sm text-[#94a3b8]">YouTube</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {metrics.youtube_subscribers ? formatNumber(metrics.youtube_subscribers) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-black rounded text-xs flex items-center justify-center text-white font-bold">TK</span>
                    <span className="text-sm text-[#94a3b8]">TikTok</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {metrics.tiktok_followers ? formatNumber(metrics.tiktok_followers) : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {['Instagram', 'YouTube', 'TikTok'].map(p => (
                  <div key={p} className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0">
                    <span className="text-sm text-[#475569]">{p}</span>
                    <span className="text-sm text-[#334155]">Sin datos</span>
                  </div>
                ))}
              </div>
            )}

            <a href="/metrics" className="block mt-4 text-xs text-[#ff8c42] hover:underline">
              Ver métricas completas →
            </a>
          </div>

          {/* Activity timeline */}
          <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-[#ff8c42]">◒</span> Actividad reciente
            </h3>

            {recentActions.length === 0 ? (
              <p className="text-sm text-[#475569] py-8 text-center">Sin actividad registrada</p>
            ) : (
              <div className="space-y-2">
                {recentActions.slice(0, 10).map((action, i) => (
                  <div key={action.id} className="flex items-start gap-3 py-2 border-b border-[#334155]/50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff8c42] mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#94a3b8] truncate">{action.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#334155]">{action.created_by}</span>
                        <span className="text-xs text-[#334155]">·</span>
                        <span className="text-xs text-[#334155]">{formatRelative(action.created_at)}</span>
                      </div>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                ))}
              </div>
            )}

            <a href="/audit" className="block mt-4 text-xs text-[#ff8c42] hover:underline">
              Ver audit log completo →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
