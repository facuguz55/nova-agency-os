'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Subproject {
  id: string; name: string; status: string; budget: number | null; description: string | null
}

interface PortalData {
  client: { id: string; name: string; email: string | null; industry: string | null; contact_person: string | null; notes: string | null }
  projects: Array<{ id: string; name: string; status: string; budget: number | null; created_at: string; subprojects: Subproject[] }>
  tasks: Array<{ id: string; title: string; status: string; priority: string; due_date: string | null; assigned_to: string | null }>
  reports: Array<{ id: string; title: string; period: string; created_at: string }>
  team: Array<{ id: string; name: string; role: string; whatsapp: string | null }>
}

const STATUS_LABEL: Record<string, string> = {
  active: 'En curso', completed: 'Completado', paused: 'Pausado', planning: 'Planificando',
}
const STATUS_BG: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  completed: 'bg-white/5 text-white/40 ring-1 ring-white/10',
  paused:    'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20',
  planning:  'bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20',
}
const PRIO_DOT: Record<string, string> = {
  urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-amber-400', low: 'bg-white/20',
}

function Ring({ pct, color = '#f97316', size = 56 }: { pct: number; color?: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray .8s ease' }}
      />
    </svg>
  )
}

export default function PortalInicio() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pin = localStorage.getItem(`portal_pin_${token}`)
    if (!pin) { router.replace(`/portal/${token}`); return }
    fetch(`/api/portal/${token}/data?pin=${pin}`)
      .then(r => {
        if (r.status === 401 || r.status === 404) {
          localStorage.removeItem(`portal_pin_${token}`)
          router.replace(`/portal/${token}`)
          return null
        }
        return r.json()
      })
      .then(json => { if (json) setData(json) })
      .finally(() => setLoading(false))
  }, [token, router])

  if (loading) return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
      </div>
    </div>
  )

  if (!data) return null
  const { client, projects, tasks, reports, team } = data

  const allSubs    = projects.flatMap(p => p.subprojects || [])
  const allItems   = [...projects, ...allSubs]
  const activeP    = allItems.filter(p => p.status === 'active').length
  const completedP = allItems.filter(p => p.status === 'completed').length
  const pct        = allItems.length > 0 ? Math.round((completedP / allItems.length) * 100) : 0

  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const first = client.name.split(' ')[0]

  return (
    <>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fs-1 { animation: fadeSlide .5s ease both; }
        .fs-2 { animation: fadeSlide .5s .1s ease both; }
        .fs-3 { animation: fadeSlide .5s .2s ease both; }
        .fs-4 { animation: fadeSlide .5s .3s ease both; }
        .fs-5 { animation: fadeSlide .5s .4s ease both; }
        .portal-inicio { font-family: 'Plus Jakarta Sans', sans-serif; }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
        }
        .glow-bar {
          background: linear-gradient(90deg, #f97316, #fb923c 40%, #f97316);
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      <div className="portal-inicio min-h-screen bg-[#050c1a] text-white">
        {/* Gradient orb background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 -left-32 w-80 h-80 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050c1a]/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between">
          <Image src="/logo-nova-dark.png" alt="Nova Agency" width={40} height={40} className="object-contain rounded-xl" />
          <div className="flex items-center gap-2">
            <Link
              href={`/portal/${token}/bienvenida`}
              className="text-[11px] text-[#f97316] flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#f97316]/25 hover:border-[#f97316]/50 transition-colors font-semibold tracking-wide"
            >
              Bienvenida
            </Link>
            {reports.length > 0 && (
              <Link
                href={`/portal/${token}/reportes`}
                className="text-[11px] text-white/40 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 hover:text-white/60 transition-colors font-medium"
              >
                Reportes
              </Link>
            )}
          </div>
        </header>

        <div className="max-w-xl mx-auto px-5 pt-8 pb-20 space-y-7 relative">

          {/* Hero greeting */}
          <div className="fs-1">
            <p className="text-white/35 text-sm font-medium tracking-wide mb-0.5">{greeting},</p>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}
              className="text-[34px] text-white leading-none mb-1">
              {first}
            </h1>
            {client.industry && (
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase">{client.industry}</p>
            )}
          </div>

          {/* Progress ring + stats */}
          <div className="fs-2 card-glass rounded-3xl p-5 flex items-center gap-5">
            <div className="relative shrink-0">
              <Ring pct={pct} size={80} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">{pct}%</span>
                <span className="text-[9px] text-white/30 uppercase tracking-wider">avance</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              {[
                { n: allItems.length, label: 'Total', color: 'text-white' },
                { n: activeP, label: 'En curso', color: 'text-emerald-400' },
                { n: completedP, label: 'Listos', color: 'text-[#f97316]' },
              ].map(({ n, label, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl font-black leading-none ${color}`}>{n}</p>
                  <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proyectos */}
          {projects.length > 0 && (
            <div className="fs-3">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Tus proyectos</p>
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} className="card-glass rounded-2xl overflow-hidden">
                    {/* Proyecto padre */}
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-base"
                        style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{p.name}</p>
                        {p.budget && (
                          <p className="text-[11px] text-white/30 mt-0.5">
                            ${Number(p.budget).toLocaleString('es-AR')} ARS
                          </p>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BG[p.status] || 'bg-white/5 text-white/30'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </div>

                    {/* Subproyectos */}
                    {p.subprojects && p.subprojects.length > 0 && (
                      <div className="border-t border-white/[0.04] divide-y divide-white/[0.03]">
                        {p.subprojects.map(s => (
                          <div key={s.id} className="flex items-center gap-3 pl-8 pr-5 py-3">
                            <div className="w-1 h-5 rounded-full shrink-0" style={{ background: 'rgba(249,115,22,0.35)' }} />
                            <p className="text-[12px] text-white/55 flex-1 truncate font-medium">{s.name}</p>
                            {s.budget && (
                              <span className="text-[11px] text-[#f97316]/60 shrink-0">
                                ${Number(s.budget).toLocaleString('es-AR')}
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BG[s.status] || 'bg-white/5 text-white/30'}`}>
                              {STATUS_LABEL[s.status] || s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trabajo en curso */}
          {tasks.length > 0 && (
            <div className="fs-4">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Trabajo en curso</p>
              <div className="card-glass rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                {tasks.slice(0, 6).map(t => (
                  <div key={t.id} className="px-5 py-3.5 flex items-center gap-3.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIO_DOT[t.priority] || 'bg-white/20'}`} />
                    <p className="text-sm text-white/70 flex-1 truncate">{t.title}</p>
                    {t.due_date && (
                      <p className="text-[11px] text-white/25 shrink-0 font-medium">
                        {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipo */}
          {team.length > 0 && (
            <div className="fs-5">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Tu equipo</p>
              <div className="grid grid-cols-2 gap-3">
                {team.map(m => (
                  m.whatsapp ? (
                    <a
                      key={m.id}
                      href={`https://wa.me/${m.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="card-glass rounded-2xl p-4 flex flex-col gap-3 hover:border-[#f97316]/25 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[#f97316] text-lg"
                        style={{ background: 'rgba(249,115,22,0.1)' }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors leading-tight">{m.name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">{m.role}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400/80 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        WhatsApp
                      </span>
                    </a>
                  ) : (
                    <div
                      key={m.id}
                      className="card-glass rounded-2xl p-4 flex flex-col gap-3"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[#f97316] text-lg"
                        style={{ background: 'rgba(249,115,22,0.1)' }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90 leading-tight">{m.name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">{m.role}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-white/15 tracking-widest uppercase py-2">
            Nova Agency ·{' '}
            <a href="https://instagram.com/novaagencytec" target="_blank" rel="noreferrer" className="hover:text-[#f97316]/60 transition-colors">
              @novaagencytec
            </a>
          </p>

        </div>
      </div>
    </>
  )
}
