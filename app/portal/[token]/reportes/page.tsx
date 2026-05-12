'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, Plus } from 'lucide-react'

interface Report { id: string; title: string; period: string; content: string; created_at: string }
interface PortalData { client: { name: string }; reports: Report[] }

export default function PortalReportes() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)

  async function load() {
    const pin = localStorage.getItem(`portal_pin_${token}`)
    if (!pin) { router.replace(`/portal/${token}`); return }

    const res = await fetch(`/api/portal/${token}/data?pin=${pin}`)
    if (res.status === 401) { localStorage.removeItem(`portal_pin_${token}`); router.replace(`/portal/${token}`); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  async function generateReport() {
    const pin = localStorage.getItem(`portal_pin_${token}`)
    if (!pin) return
    setGenerating(true)
    const res = await fetch(`/api/portal/${token}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) await load()
    setGenerating(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#060d18] flex items-center justify-center">
      <div className="w-8 h-8 rounded-xl bg-[#f97316] animate-pulse" />
    </div>
  )

  if (!data) return null
  const { client, reports } = data

  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      <header className="bg-[#0d1b2e] border-b border-[#1a2d45] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/portal/${token}/inicio`} className="text-[#4a6080] hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs text-[#4a6080]">{client.name}</p>
            <p className="text-sm font-semibold text-white">Reportes mensuales</p>
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {generating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          {generating ? 'Generando...' : 'Generar reporte'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1a2d45] flex items-center justify-center">
              <FileText size={20} className="text-[#334155]" />
            </div>
            <p className="text-sm text-[#4a6080]">No hay reportes disponibles todavía</p>
            <button onClick={generateReport} disabled={generating} className="text-xs text-[#f97316] hover:text-[#fb923c]">
              {generating ? 'Generando...' : 'Generar el primero'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map(r => (
              <div
                key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                className="bg-[#0d1b2e] border border-[#1a2d45] hover:border-[#253f60] rounded-xl p-5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  <p className="text-[11px] text-[#4a6080]">{new Date(r.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <p className="text-xs text-[#4a6080] capitalize">{r.period}</p>

                {selected?.id === r.id && (
                  <div className="mt-4 pt-4 border-t border-[#1a2d45]">
                    <pre className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap font-sans">{r.content}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
