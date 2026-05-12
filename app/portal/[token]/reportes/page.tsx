'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Sparkles, ChevronDown, FileText } from 'lucide-react'

interface Report { id: string; title: string; period: string; content: string; created_at: string }
interface PortalData { client: { name: string }; reports: Report[] }

export default function PortalReportes() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()
  const [data, setData]         = useState<PortalData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) await load()
    setGenerating(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050c1a' }}>
      <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-ping" />
    </div>
  )

  if (!data) return null
  const { client, reports } = data

  return (
    <>
      <style>{`
        .rep-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rep-display { font-family: 'Instrument Serif', serif; }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      <div className="rep-font min-h-screen text-white" style={{ background: '#050c1a' }}>
        {/* Gradient bg */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(ellipse, #f97316 0%, transparent 70%)' }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050c1a]/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/portal/${token}/inicio`}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-all text-lg leading-none">
              ←
            </Link>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">{client.name}</p>
              <p className="rep-display text-white font-semibold leading-tight" style={{ fontStyle: 'italic', fontSize: 17 }}>
                Reportes mensuales
              </p>
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
          >
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {generating ? 'Generando...' : 'Generar'}
          </button>
        </header>

        <div className="max-w-xl mx-auto px-5 py-8 relative">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <FileText size={24} className="text-white/20" />
              </div>
              <div className="text-center">
                <p className="rep-display text-white/60 text-lg" style={{ fontStyle: 'italic' }}>No hay reportes todavía</p>
                <p className="text-white/25 text-xs mt-1">Generá el primero para ver el análisis IA</p>
              </div>
              <button onClick={generateReport} disabled={generating}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                {generating ? 'Generando...' : 'Generar primer reporte'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r, idx) => (
                <div
                  key={r.id}
                  className="card-glass rounded-2xl overflow-hidden fade-up"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* Header del reporte */}
                  <button
                    onClick={() => setSelected(selected === r.id ? null : r.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(249,115,22,0.1)' }}>
                      <FileText size={15} className="text-[#f97316]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/90 truncate">{r.title}</p>
                      <p className="text-[11px] text-white/30 capitalize mt-0.5">{r.period}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-[11px] text-white/20">
                        {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                      <ChevronDown
                        size={14}
                        className="text-white/30 transition-transform"
                        style={{ transform: selected === r.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </div>
                  </button>

                  {/* Contenido expandido */}
                  {selected === r.id && (
                    <div className="px-5 pb-5 pt-0 border-t border-white/[0.06]">
                      <div className="pt-4 prose-sm">
                        <pre className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap font-sans">
                          {r.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
