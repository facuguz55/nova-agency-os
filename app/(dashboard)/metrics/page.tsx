'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, formatNumber } from '@/lib/utils'

interface IGMetric { id: string; followers: number; engagement_rate: number | null; top_post: string | null; top_post_likes: number | null; timestamp: string }
interface YTMetric { id: string; subscribers: number; views: number; avg_watch_time_minutes: number | null; timestamp: string }
interface TKMetric { id: string; followers: number; engagement_rate: number | null; top_video: string | null; top_video_views: number | null; timestamp: string }

type Platform = 'instagram' | 'youtube' | 'tiktok'

export default function MetricsPage() {
  const [ig, setIg] = useState<IGMetric[]>([])
  const [yt, setYt] = useState<YTMetric[]>([])
  const [tk, setTk] = useState<TKMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Platform | null>(null)
  const [saving, setSaving] = useState(false)

  const [igForm, setIgForm] = useState({ followers: '', engagement_rate: '', top_post: '', top_post_likes: '' })
  const [ytForm, setYtForm] = useState({ subscribers: '', views: '', avg_watch_time_minutes: '' })
  const [tkForm, setTkForm] = useState({ followers: '', engagement_rate: '', top_video: '', top_video_views: '' })

  async function loadAll() {
    setLoading(true)
    const [igRes, ytRes, tkRes] = await Promise.all([
      fetch('/api/metrics/instagram'),
      fetch('/api/metrics/youtube'),
      fetch('/api/metrics/tiktok'),
    ])
    const [igData, ytData, tkData] = await Promise.all([igRes.json(), ytRes.json(), tkRes.json()])
    setIg(igData.metrics || [])
    setYt(ytData.metrics || [])
    setTk(tkData.metrics || [])
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function savePlatform() {
    setSaving(true)
    if (modal === 'instagram') {
      await fetch('/api/metrics/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followers: parseInt(igForm.followers),
          engagement_rate: igForm.engagement_rate ? parseFloat(igForm.engagement_rate) : null,
          top_post: igForm.top_post || null,
          top_post_likes: igForm.top_post_likes ? parseInt(igForm.top_post_likes) : null,
        }),
      })
    } else if (modal === 'youtube') {
      await fetch('/api/metrics/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribers: parseInt(ytForm.subscribers),
          views: parseInt(ytForm.views),
          avg_watch_time_minutes: ytForm.avg_watch_time_minutes ? parseFloat(ytForm.avg_watch_time_minutes) : null,
        }),
      })
    } else if (modal === 'tiktok') {
      await fetch('/api/metrics/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followers: parseInt(tkForm.followers),
          engagement_rate: tkForm.engagement_rate ? parseFloat(tkForm.engagement_rate) : null,
          top_video: tkForm.top_video || null,
          top_video_views: tkForm.top_video_views ? parseInt(tkForm.top_video_views) : null,
        }),
      })
    }
    setSaving(false)
    setModal(null)
    loadAll()
  }

  const latestIG = ig[0]
  const latestYT = yt[0]
  const latestTK = tk[0]

  const platforms = [
    {
      key: 'instagram' as Platform,
      name: 'Instagram',
      emoji: 'IG',
      gradient: 'from-purple-500 to-pink-500',
      data: latestIG,
      metrics: latestIG ? [
        { label: 'Seguidores', value: formatNumber(latestIG.followers) },
        { label: 'Engagement', value: latestIG.engagement_rate ? `${latestIG.engagement_rate}%` : '—' },
        { label: 'Top post likes', value: latestIG.top_post_likes ? formatNumber(latestIG.top_post_likes) : '—' },
      ] : [],
      history: ig,
    },
    {
      key: 'youtube' as Platform,
      name: 'YouTube',
      emoji: 'YT',
      gradient: 'from-red-500 to-red-600',
      data: latestYT,
      metrics: latestYT ? [
        { label: 'Suscriptores', value: formatNumber(latestYT.subscribers) },
        { label: 'Vistas totales', value: formatNumber(latestYT.views) },
        { label: 'Avg watch time', value: latestYT.avg_watch_time_minutes ? `${latestYT.avg_watch_time_minutes}min` : '—' },
      ] : [],
      history: yt,
    },
    {
      key: 'tiktok' as Platform,
      name: 'TikTok',
      emoji: 'TK',
      gradient: 'from-gray-800 to-black',
      data: latestTK,
      metrics: latestTK ? [
        { label: 'Seguidores', value: formatNumber(latestTK.followers) },
        { label: 'Engagement', value: latestTK.engagement_rate ? `${latestTK.engagement_rate}%` : '—' },
        { label: 'Top video vistas', value: latestTK.top_video_views ? formatNumber(latestTK.top_video_views) : '—' },
      ] : [],
      history: tk,
    },
  ]

  return (
    <>
      <Header
        title="Métricas"
        subtitle="Redes sociales — datos on-demand"
        actions={
          <Button variant="secondary" onClick={loadAll} size="sm">↻ Actualizar</Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><p className="text-[#475569] text-sm">Cargando...</p></div>
        ) : (
          <>
            {/* Tarjetas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map(p => (
                <div key={p.key} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 bg-gradient-to-br ${p.gradient} rounded-lg flex items-center justify-center text-xs font-bold text-white`}>
                        {p.emoji}
                      </div>
                      <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setModal(p.key)}>
                      + Cargar
                    </Button>
                  </div>

                  {p.data ? (
                    <>
                      <div className="space-y-3">
                        {p.metrics.map(m => (
                          <div key={m.label} className="flex justify-between items-center">
                            <span className="text-xs text-[#475569]">{m.label}</span>
                            <span className="text-sm font-semibold text-white">{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-[#334155] mt-3">
                        Actualizado: {formatDate(p.data.timestamp)}
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-[#475569]">Sin datos</p>
                      <p className="text-xs text-[#334155] mt-1">Cargá métricas manualmente</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Historial por plataforma */}
            {platforms.map(p => p.history.length > 1 && (
              <div key={p.key + '_hist'} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">{p.name} — Historial</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#334155]">
                        <th className="text-left py-2 px-3 text-xs text-[#475569]">Fecha</th>
                        {p.key === 'instagram' && <>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Seguidores</th>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Engagement</th>
                        </>}
                        {p.key === 'youtube' && <>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Suscriptores</th>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Vistas</th>
                        </>}
                        {p.key === 'tiktok' && <>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Seguidores</th>
                          <th className="text-right py-2 px-3 text-xs text-[#475569]">Engagement</th>
                        </>}
                      </tr>
                    </thead>
                    <tbody>
                      {p.history.slice(0, 10).map((h: { id: string; timestamp: string; followers?: number; subscribers?: number; views?: number; engagement_rate?: number | null }) => (
                        <tr key={h.id} className="border-b border-[#334155]/30 last:border-0">
                          <td className="py-2 px-3 text-xs text-[#475569]">{formatDate(h.timestamp)}</td>
                          {p.key === 'instagram' && <>
                            <td className="py-2 px-3 text-right text-white">{formatNumber((h as IGMetric).followers)}</td>
                            <td className="py-2 px-3 text-right text-[#94a3b8]">{(h as IGMetric).engagement_rate ? `${(h as IGMetric).engagement_rate}%` : '—'}</td>
                          </>}
                          {p.key === 'youtube' && <>
                            <td className="py-2 px-3 text-right text-white">{formatNumber((h as YTMetric).subscribers)}</td>
                            <td className="py-2 px-3 text-right text-[#94a3b8]">{formatNumber((h as YTMetric).views)}</td>
                          </>}
                          {p.key === 'tiktok' && <>
                            <td className="py-2 px-3 text-right text-white">{formatNumber((h as TKMetric).followers)}</td>
                            <td className="py-2 px-3 text-right text-[#94a3b8]">{(h as TKMetric).engagement_rate ? `${(h as TKMetric).engagement_rate}%` : '—'}</td>
                          </>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modal Instagram */}
      <Modal open={modal === 'instagram'} onClose={() => setModal(null)} title="Cargar métricas Instagram">
        <div className="space-y-4">
          <Input label="Seguidores *" value={igForm.followers} onChange={e => setIgForm(f => ({ ...f, followers: e.target.value }))} type="number" placeholder="10000" />
          <Input label="Engagement rate (%)" value={igForm.engagement_rate} onChange={e => setIgForm(f => ({ ...f, engagement_rate: e.target.value }))} type="number" step="0.01" placeholder="3.5" />
          <Input label="URL top post" value={igForm.top_post} onChange={e => setIgForm(f => ({ ...f, top_post: e.target.value }))} placeholder="https://instagram.com/p/..." />
          <Input label="Likes top post" value={igForm.top_post_likes} onChange={e => setIgForm(f => ({ ...f, top_post_likes: e.target.value }))} type="number" placeholder="500" />
          <div className="flex gap-3 pt-2">
            <Button onClick={savePlatform} disabled={saving || !igForm.followers}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal YouTube */}
      <Modal open={modal === 'youtube'} onClose={() => setModal(null)} title="Cargar métricas YouTube">
        <div className="space-y-4">
          <Input label="Suscriptores *" value={ytForm.subscribers} onChange={e => setYtForm(f => ({ ...f, subscribers: e.target.value }))} type="number" placeholder="5000" />
          <Input label="Vistas totales *" value={ytForm.views} onChange={e => setYtForm(f => ({ ...f, views: e.target.value }))} type="number" placeholder="150000" />
          <Input label="Avg watch time (min)" value={ytForm.avg_watch_time_minutes} onChange={e => setYtForm(f => ({ ...f, avg_watch_time_minutes: e.target.value }))} type="number" step="0.1" placeholder="4.5" />
          <div className="flex gap-3 pt-2">
            <Button onClick={savePlatform} disabled={saving || !ytForm.subscribers || !ytForm.views}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal TikTok */}
      <Modal open={modal === 'tiktok'} onClose={() => setModal(null)} title="Cargar métricas TikTok">
        <div className="space-y-4">
          <Input label="Seguidores *" value={tkForm.followers} onChange={e => setTkForm(f => ({ ...f, followers: e.target.value }))} type="number" placeholder="8000" />
          <Input label="Engagement rate (%)" value={tkForm.engagement_rate} onChange={e => setTkForm(f => ({ ...f, engagement_rate: e.target.value }))} type="number" step="0.01" placeholder="5.2" />
          <Input label="URL top video" value={tkForm.top_video} onChange={e => setTkForm(f => ({ ...f, top_video: e.target.value }))} placeholder="https://tiktok.com/@..." />
          <Input label="Vistas top video" value={tkForm.top_video_views} onChange={e => setTkForm(f => ({ ...f, top_video_views: e.target.value }))} type="number" placeholder="25000" />
          <div className="flex gap-3 pt-2">
            <Button onClick={savePlatform} disabled={saving || !tkForm.followers}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
