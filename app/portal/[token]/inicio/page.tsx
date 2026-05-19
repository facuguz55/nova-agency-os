'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Objective  { id: string; title: string; current_value: number; target_value: number; unit: string }
interface Subproject { id: string; name: string; status: string; budget: number | null; description: string | null }
interface Project {
  id: string; name: string; status: string; budget: number | null; created_at: string; description: string | null
  featured_until: string | null
  subprojects: Subproject[]
  objectives:  Objective[]
  feedback:    'up' | 'down' | null
}
interface Task   { id: string; title: string; status: string; priority: string; due_date: string | null; assigned_to: string | null }
interface Report { id: string; title: string; period: string; created_at: string }
interface Member { id: string; name: string; role: string; whatsapp: string | null }

interface RoadmapWeek { id: string; week: number; title: string; items: string[] }

interface PortalData {
  client:   { id: string; name: string; email: string | null; industry: string | null; contact_person: string | null; notes: string | null; created_at: string }
  projects: Project[]
  tasks:    Task[]
  reports:  Report[]
  team:     Member[]
  roadmap:  RoadmapWeek[]
}

type MsgType = 'new_service' | 'problem' | 'note'

const STATUS_LABEL: Record<string, string> = {
  active: 'ACTIVO', completed: 'COMPLETADO', paused: 'PAUSADO', planning: 'PLANIFICANDO',
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
const MSG_CONFIG: Record<MsgType, { label: string; placeholder: string; color: string }> = {
  new_service: { label: 'Nuevo servicio',    placeholder: 'Describí el servicio que necesitás', color: '#f97316' },
  problem:     { label: 'Reportar problema', placeholder: 'Describí el problema o urgencia',    color: '#f87171' },
  note:        { label: 'Dejar una nota',    placeholder: 'Escribí tu nota o comentario',       color: '#60a5fa' },
}

function Ring({ pct, color = '#f97316', size = 56 }: { pct: number; color?: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray .8s ease' }}
      />
    </svg>
  )
}

export default function PortalInicio() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()

  const [data, setData]           = useState<PortalData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => void } | null>(null)
  const [isIOS, setIsIOS]                 = useState(false)
  const [isIOSChrome, setIsIOSChrome]     = useState(false)
  const [showIOSHint, setShowIOSHint]     = useState(false)
  const [installed, setInstalled]         = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  // feedback local (optimista)
  const [feedbacks, setFeedbacks]     = useState<Record<string, 'up' | 'down' | null>>({})
  const [expandedP,  setExpandedP]    = useState<string | null>(null)
  const [expandedS,  setExpandedS]    = useState<string | null>(null)

  const toggleProject = useCallback((id: string) => {
    setExpandedP(p => p === id ? null : id)
    setExpandedS(null)
  }, [])
  const toggleSub = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedS(s => s === id ? null : id)
  }, [])

  // push notifications
  const [pushState, setPushState] = useState<'idle' | 'loading' | 'subscribed' | 'denied'>('idle')

  // roadmap drawer/sheet
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  // solicitud / nota / problema
  const [fabOpen, setFabOpen]       = useState(false)
  const [sheet, setSheet]           = useState<MsgType | null>(null)
  const [msgTitle, setMsgTitle]     = useState('')
  const [msgBody, setMsgBody]       = useState('')
  const [msgProject, setMsgProject] = useState('')
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  useEffect(() => {
    const ua  = navigator.userAgent
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    if (Notification.permission === 'granted') setPushState('subscribed')
    else if (Notification.permission === 'denied') setPushState('denied')
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window.navigator as { standalone?: boolean }).standalone
    const iosChrome = ios && /CriOS/i.test(ua)
    setIsIOS(ios)
    setIsIOSChrome(iosChrome)
    setInstallDismissed(!!localStorage.getItem(`install_dismissed_${token}`))
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as unknown as { prompt: () => void }) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [token])

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
      .then(json => {
        if (json) {
          setData(json)
          document.title = `Portal ${json.client.name} | Nova OS`
          const fb: Record<string, 'up' | 'down' | null> = {}
          ;(json.projects as Project[]).forEach(p => { fb[p.id] = p.feedback })
          setFeedbacks(fb)
        }
      })
      .finally(() => setLoading(false))
  }, [token, router])

  async function submitFeedback(projectId: string, vote: 'up' | 'down') {
    const prev = feedbacks[projectId]
    const next = prev === vote ? null : vote
    setFeedbacks(f => ({ ...f, [projectId]: next }))
    const pin = localStorage.getItem(`portal_pin_${token}`)
    await fetch(`/api/portal/${token}/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, project_id: projectId, vote: next ?? vote }),
    })
  }

  async function submitMessage() {
    if (!msgBody.trim() || !sheet) return
    setSending(true)
    const pin = localStorage.getItem(`portal_pin_${token}`)
    const res = await fetch(`/api/portal/${token}/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, type: sheet, title: msgTitle || null, body: msgBody, project_id: msgProject || null }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
      setTimeout(() => { setSent(false); setSheet(null); setMsgTitle(''); setMsgBody(''); setMsgProject('') }, 2000)
    }
  }

  async function subscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushState('loading')
    try {
      const reg  = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setPushState('denied'); return }
      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      const pin = localStorage.getItem(`portal_pin_${token}`)
      await fetch(`/api/portal/${token}/push-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, subscription: sub.toJSON() }),
      })
      setPushState('subscribed')
    } catch { setPushState('idle') }
  }

  const diasJuntos = useMemo(
    () => data?.client?.created_at ? Math.floor((Date.now() - new Date(data.client.created_at).getTime()) / 86400000) : null,
    [data?.client?.created_at]
  )

  if (loading) return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
    </div>
  )
  if (!data) return null

  const { client, projects, tasks, reports, team, roadmap } = data
  const allSubs    = projects.flatMap(p => p.subprojects || [])
  const allItems   = [...projects, ...allSubs]
  const activeP    = allItems.filter(p => p.status === 'active').length
  const completedP = allItems.filter(p => p.status === 'completed').length
  const pct        = allItems.length > 0 ? Math.round((completedP / allItems.length) * 100) : 0

  const hour     = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const first    = client.name.split(' ')[0]

  // Tareas con fecha para el calendario
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 8)

  // Objetivos de todos los proyectos
  const allObjectives = projects.flatMap(p =>
    (p.objectives || []).map(o => ({ ...o, projectName: p.name }))
  )

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
        .fs-6 { animation: fadeSlide .5s .5s ease both; }
        .fs-7 { animation: fadeSlide .5s .6s ease both; }
        .portal-inicio { font-family: 'Plus Jakarta Sans', sans-serif; }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .sheet-anim { animation: slideUp .3s cubic-bezier(.32,.72,0,1) both; }
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes roadmapIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawerIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes sheetIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .drawer-anim { animation: drawerIn .32s cubic-bezier(.32,.72,0,1) both; }
        .sheet-roadmap-anim { animation: sheetIn .32s cubic-bezier(.32,.72,0,1) both; }
      `}</style>

      <div className="portal-inicio min-h-screen bg-[#050c1a] text-white">

        {/* Fondo — cuadrícula de líneas en movimiento */}
        <div className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            animation: 'gridScroll 14s linear infinite',
            filter: 'blur(0.4px)',
          }}
        />

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050c1a]/80 backdrop-blur-xl px-5 flex items-center justify-between"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: '16px' }}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: '#0d1828' }}>
            <Image src="/logo-nova-dark.png" alt="Nova Agency" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/portal/${token}/bienvenida`}
              className="text-[11px] text-[#f97316] px-3 py-1.5 rounded-xl border border-[#f97316]/25 hover:border-[#f97316]/50 transition-colors font-semibold">
              Bienvenida
            </Link>
            {reports.length > 0 && (
              <Link href={`/portal/${token}/reportes`}
                className="text-[11px] text-white/40 px-3 py-1.5 rounded-xl border border-white/10 hover:text-white/60 transition-colors font-medium">
                Reportes
              </Link>
            )}
          </div>
        </header>


        <div className="max-w-xl mx-auto px-5 pt-8 pb-28 space-y-7 relative">

          {/* Saludo */}
          <div className="fs-1">
            <p className="text-white/35 text-sm font-medium tracking-wide mb-0.5">{greeting},</p>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}
              className="text-[34px] text-white leading-none mb-1">
              {first}
            </h1>
            {client.industry && (
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase">{client.industry}</p>
            )}
            {diasJuntos !== null && diasJuntos > 0 && (
              <p className="text-white/20 text-[11px] font-medium mt-1.5">
                {diasJuntos === 1 ? 'Primer día juntos' : `Llevamos ${diasJuntos} días trabajando juntos`}
              </p>
            )}
          </div>

          {/* Banner de instalación */}
          {!installed && !installDismissed && (installPrompt || isIOS) && (() => {
            const dismiss = () => {
              localStorage.setItem(`install_dismissed_${token}`, '1')
              setInstallDismissed(true)
            }

            // iOS Chrome — no puede instalar
            if (isIOSChrome) return (
              <div className="fs-2 rounded-2xl px-4 py-4 flex gap-3 items-start"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>🌐</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80">Abrí este portal en Safari</p>
                  <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">Chrome en iPhone no permite instalar apps. Copiá el link y pegalo en Safari para poder guardar el portal en tu pantalla de inicio.</p>
                </div>
                <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )

            // iOS Safari — guía paso a paso
            if (isIOS) return (
              <div className="fs-2 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ background: 'rgba(249,115,22,0.1)' }}>📲</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/90">Guardá el portal en tu iPhone</p>
                    <p className="text-[11px] text-white/35 mt-0.5">Accedé en un tap, sin buscar el link.</p>
                  </div>
                  <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="px-4 pb-4 flex items-center gap-2">
                  {[
                    { icon: '⬆️', label: 'Tocá Compartir' },
                    { icon: '→', label: null },
                    { icon: '➕', label: 'Agregar a inicio' },
                    { icon: '→', label: null },
                    { icon: '✅', label: 'Agregar' },
                  ].map((s, i) =>
                    s.label === null
                      ? <span key={i} className="text-white/15 text-xs">›</span>
                      : (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>{s.icon}</div>
                          <p className="text-[9px] text-white/25 text-center leading-tight">{s.label}</p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )

            // Android / Chrome — prompt nativo
            return (
              <div className="fs-2 rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}>
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ background: 'rgba(249,115,22,0.12)' }}>📲</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Instalá el portal</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Accedé en un tap desde tu pantalla de inicio.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { installPrompt?.prompt(); setInstallPrompt(null); dismiss() }}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                    Instalar
                  </button>
                  <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Banner notificaciones push */}
          {typeof window !== 'undefined' && 'Notification' in window && pushState !== 'subscribed' && pushState !== 'denied' && (
            <div className="fs-2 rounded-2xl px-4 py-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}>🔔</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/80">Activá las notificaciones</p>
                <p className="text-[11px] text-white/30 mt-0.5">Te avisamos cuando haya novedades de tu proyecto.</p>
              </div>
              <button
                onClick={subscribePush}
                disabled={pushState === 'loading'}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white/70 border border-white/15 hover:border-white/30 hover:text-white transition-all disabled:opacity-40"
              >
                {pushState === 'loading' ? '...' : 'Activar'}
              </button>
            </div>
          )}

          {/* Progress ring */}
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
                { n: allItems.length, label: 'Total',    color: 'text-white' },
                { n: activeP,         label: 'En curso', color: 'text-emerald-400' },
                { n: completedP,      label: 'Listos',   color: 'text-[#f97316]' },
              ].map(({ n, label, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl font-black leading-none ${color}`}>{n}</p>
                  <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Proyectos + feedback */}
          {projects.length > 0 && (
            <div className="fs-3">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Tus proyectos</p>
              <div className="space-y-3">
                {projects.map(p => {
                  const isExpanded = expandedP === p.id
                  const subsBudget = (p.subprojects || []).reduce((a, s) => a + (Number(s.budget) || 0), 0)
                  const totalBudget = (Number(p.budget) || 0) + subsBudget
                  return (
                    <div key={p.id} className="rounded-2xl overflow-hidden transition-all duration-200"
                      style={p.featured_until && new Date(p.featured_until) > new Date()
                        ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.45)', boxShadow: '0 0 28px rgba(249,115,22,0.15), inset 0 0 28px rgba(249,115,22,0.04)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                      }>

                      {/* Barra de acento para proyectos destacados */}
                      {p.featured_until && new Date(p.featured_until) > new Date() && (
                        <div className="flex items-center gap-2 px-5 py-2.5"
                          style={{ background: 'linear-gradient(90deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.06) 60%, transparent 100%)', borderBottom: '1px solid rgba(249,115,22,0.2)' }}>
                          <div className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse shrink-0"
                            style={{ boxShadow: '0 0 8px rgba(249,115,22,0.8)' }} />
                          <span className="text-[11px] font-black uppercase tracking-[.2em] text-[#f97316]">Nuevo · Recién lanzado</span>
                        </div>
                      )}

                      {/* Header clickeable */}
                      <button
                        onClick={() => toggleProject(p.id)}
                        className="w-full px-5 py-4 flex items-center gap-4 text-left"
                      >
                        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-base"
                          style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/90 truncate">{p.name}</p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            {p.subprojects?.length > 0 ? `${p.subprojects.length} etapa${p.subprojects.length !== 1 ? 's' : ''}` : 'Sin etapas'}
                            {totalBudget > 0 && ` · $${Number(totalBudget).toLocaleString('es-AR')}`}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BG[p.status] || 'bg-white/5 text-white/30'}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                        <span className="text-white/30 text-xs ml-1 transition-transform duration-200" style={{ display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                      </button>

                      {/* Detalle expandido del proyecto */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.05]" style={{ animation: 'fadeSlide .2s ease both' }}>
                          {/* Descripción */}
                          {p.description && (
                            <div className="px-5 py-3 border-b border-white/[0.04]">
                              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5">Descripción</p>
                              <p className="text-[13px] text-white/60 leading-relaxed">{p.description}</p>
                            </div>
                          )}

                          {/* Presupuesto */}
                          {totalBudget > 0 && (
                            <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                              <p className="text-[10px] text-white/25 uppercase tracking-widest">Presupuesto total</p>
                              <p className="text-sm font-black text-[#f97316]">${Number(totalBudget).toLocaleString('es-AR')} ARS</p>
                            </div>
                          )}

                          {/* Subproyectos expandibles */}
                          {p.subprojects?.length > 0 && (
                            <div className="divide-y divide-white/[0.03]">
                              <p className="text-[10px] text-white/20 uppercase tracking-widest px-5 pt-3 pb-1.5">Etapas del proyecto</p>
                              {p.subprojects.map(s => {
                                const isSubExp = expandedS === s.id
                                return (
                                  <div key={s.id}>
                                    <button
                                      onClick={(e) => toggleSub(s.id, e)}
                                      className="w-full flex items-center gap-3 pl-8 pr-5 py-3 text-left"
                                    >
                                      <div className="w-1 h-5 rounded-full shrink-0" style={{ background: 'rgba(249,115,22,0.35)' }} />
                                      <p className="text-[12px] text-white/60 flex-1 font-medium">{s.name}</p>
                                      {s.budget && (
                                        <p className="text-[11px] text-[#f97316]/60 mr-2">${Number(s.budget).toLocaleString('es-AR')}</p>
                                      )}
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BG[s.status] || 'bg-white/5 text-white/30'}`}>
                                        {STATUS_LABEL[s.status] || s.status}
                                      </span>
                                      <span className="text-white/20 text-xs ml-1 transition-transform duration-200" style={{ display: 'inline-block', transform: isSubExp ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                                    </button>

                                    {/* Detalle del subproyecto */}
                                    {isSubExp && s.description && (
                                      <div className="pl-12 pr-5 pb-3" style={{ animation: 'fadeSlide .15s ease both' }}>
                                        <p className="text-[12px] text-white/40 leading-relaxed">{s.description}</p>
                                      </div>
                                    )}
                                    {isSubExp && !s.description && (
                                      <div className="pl-12 pr-5 pb-3">
                                        <p className="text-[11px] text-white/20 italic">Sin descripción</p>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback */}
                      <div className="border-t border-white/[0.04] px-5 py-3 flex items-center gap-2">
                        <p className="text-[11px] text-white/25 flex-1">¿Cómo va este proyecto?</p>
                        {(['up', 'down'] as const).map(vote => {
                          const active = feedbacks[p.id] === vote
                          return (
                            <button key={vote} onClick={() => submitFeedback(p.id, vote)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all"
                              style={active
                                ? { background: vote === 'up' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', transform: 'scale(1.1)' }
                                : { background: 'rgba(255,255,255,0.04)' }
                              }>
                              {vote === 'up' ? '👍' : '👎'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Objetivos del mes */}
          {allObjectives.length > 0 && (
            <div className="fs-4">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Objetivos del mes</p>
              <div className="card-glass rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                {allObjectives.map(o => {
                  const pctO = o.target_value > 0 ? Math.min(100, Math.round((o.current_value / o.target_value) * 100)) : 0
                  return (
                    <div key={o.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white/80 font-medium">{o.title}</p>
                        <p className="text-[12px] font-black text-[#f97316]">
                          {o.current_value}{o.unit} <span className="text-white/25 font-normal">/ {o.target_value}{o.unit}</span>
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pctO}%`, background: pctO >= 100 ? '#34d399' : 'linear-gradient(90deg, #f97316, #fb923c)' }} />
                      </div>
                      <p className="text-[10px] text-white/20 mt-1">{o.projectName}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calendario de entregas */}
          {upcoming.length > 0 && (
            <div className="fs-5">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Calendario de entregas</p>
              <div className="card-glass rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                {upcoming.map(t => {
                  const d    = new Date(t.due_date!)
                  const day  = d.toLocaleDateString('es-AR', { day: '2-digit' })
                  const mon  = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
                  const past = d < new Date()
                  return (
                    <div key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="shrink-0 w-10 text-center">
                        <p className={`text-lg font-black leading-none ${past ? 'text-red-400' : 'text-[#f97316]'}`}>{day}</p>
                        <p className="text-[10px] text-white/25 uppercase tracking-wide">{mon}</p>
                      </div>
                      <div className="w-px h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/75 truncate">{t.title}</p>
                        {t.assigned_to && (
                          <p className="text-[11px] text-white/25 mt-0.5 truncate">{t.assigned_to}</p>
                        )}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${past ? 'bg-red-400' : PRIO_DOT[t.priority] || 'bg-white/20'}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Equipo */}
          {team.length > 0 && (
            <div className="fs-6">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[.16em] mb-3 px-1">Tu equipo</p>
              <div className="grid grid-cols-2 gap-3">
                {team.map(m => (
                  m.whatsapp ? (
                    <a key={m.id} href={`https://wa.me/${m.whatsapp}`} target="_blank" rel="noreferrer"
                      className="card-glass rounded-2xl p-4 flex flex-col gap-3 hover:border-[#f97316]/25 transition-colors group">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[#f97316] text-lg"
                        style={{ background: 'rgba(249,115,22,0.1)' }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors leading-tight">{m.name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5">{m.role}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400/80 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> WhatsApp
                      </span>
                    </a>
                  ) : (
                    <div key={m.id} className="card-glass rounded-2xl p-4 flex flex-col gap-3">
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

          {/* Botón Qué viene este mes */}
          {roadmap.length > 0 && (
            <div className="fs-7">
              <button
                onClick={() => setRoadmapOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-[.98] group"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(249,115,22,0.12)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Qué viene este mes</p>
                    <p className="text-[11px] text-white/35 mt-0.5">Plan semana a semana</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="2" strokeLinecap="round"
                  className="group-hover:translate-x-1 transition-transform">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="fs-7 text-center text-[10px] text-white/15 tracking-widest uppercase py-2">
            Nova Agency · <a href="https://instagram.com/novaagencytec" target="_blank" rel="noreferrer" className="hover:text-[#f97316]/60 transition-colors">@novaagencytec</a>
          </p>

        </div>

        {/* FAB — botón circular fijo abajo a la derecha */}
        {!sheet && !fabOpen && (
          <button
            onClick={() => setFabOpen(true)}
            className="fixed z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              right: '20px',
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              boxShadow: '0 8px 32px rgba(249,115,22,0.45)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {/* Sheet — selector de tipo */}
        {fabOpen && !sheet && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setFabOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="sheet-anim relative w-full rounded-t-3xl max-w-xl mx-auto overflow-hidden"
              style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="px-5 pb-6 pt-3 space-y-3">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[.18em] mb-4">¿Qué necesitás?</p>
                {(Object.entries(MSG_CONFIG) as [MsgType, typeof MSG_CONFIG[MsgType]][]).map(([type, cfg]) => (
                  <button key={type} onClick={() => { setSheet(type); setFabOpen(false) }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[.98]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                        {type === 'new_service' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                          </svg>
                        )}
                        {type === 'problem' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                          </svg>
                        )}
                        {type === 'note' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">{cfg.label}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{cfg.placeholder.replace('...', '')}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  ))}
                  <div style={{ height: 'env(safe-area-inset-bottom)' }} />
                </div>
            </div>
          </div>
        )}

        {/* Sheet — formulario */}
        {sheet && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => { setSheet(null); setMsgTitle(''); setMsgBody(''); setMsgProject('') }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="sheet-anim relative w-full rounded-t-3xl max-w-xl mx-auto overflow-hidden"
              style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
                <div className="px-5 pb-6 pt-2 space-y-3">
                  {/* Header del formulario */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <button onClick={e => { e.stopPropagation(); setMsgTitle(''); setMsgBody(''); setMsgProject(''); setSheet(null); setFabOpen(true) }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M15 18l-6-6 6-6"/>
                        </svg>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: `${MSG_CONFIG[sheet].color}15` }}>
                          {sheet === 'new_service' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MSG_CONFIG[sheet].color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                            </svg>
                          )}
                          {sheet === 'problem' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MSG_CONFIG[sheet].color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                            </svg>
                          )}
                          {sheet === 'note' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MSG_CONFIG[sheet].color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          )}
                        </div>
                        <p className="font-bold text-white text-sm">{MSG_CONFIG[sheet].label}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSheet(null); setMsgTitle(''); setMsgBody(''); setMsgProject('') }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  {sheet === 'new_service' && (
                    <input value={msgTitle} onChange={e => setMsgTitle(e.target.value)}
                      placeholder="Nombre del servicio"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  )}

                  {projects.length > 0 && sheet === 'note' && (
                    <select value={msgProject} onChange={e => setMsgProject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none appearance-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <option value="">Proyecto (opcional)</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}

                  <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)}
                    rows={4} placeholder={MSG_CONFIG[sheet].placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />

                  <button onClick={submitMessage} disabled={sending || !msgBody.trim()}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: sent ? 'rgba(52,211,153,0.2)' : `linear-gradient(135deg, ${MSG_CONFIG[sheet].color}, ${MSG_CONFIG[sheet].color}cc)` }}>
                    {sent ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                        Enviado
                      </>
                    ) : sending ? 'Enviando...' : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        Enviar
                      </>
                    )}
                  </button>

                  <div style={{ height: 'env(safe-area-inset-bottom)' }} />
                </div>
            </div>
          </div>
        )}

      {/* Roadmap drawer (PC) / sheet (móvil) */}
      {roadmapOpen && roadmap.length > 0 && (() => {
        const currentWeek = Math.min(4, Math.ceil(new Date().getDate() / 7))
        const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
        const monthLabel  = MONTH_NAMES[new Date().getMonth()]

        const RoadmapContent = () => (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <p className="text-base font-bold text-white">Qué viene este mes</p>
                <p className="text-[11px] text-white/30 mt-1 leading-relaxed max-w-[240px]">
                  Lo que vamos a hacer por vos, semana a semana.
                </p>
              </div>
              <button onClick={() => setRoadmapOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
              {roadmap.map((w, i) => {
                const isCurrent = w.week === currentWeek
                const isPast    = w.week < currentWeek
                const isLast    = i === roadmap.length - 1
                return (
                  <div key={w.id} style={{ animation: `roadmapIn .35s ${i * 0.07}s ease both` }} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0 w-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black shrink-0 ${isCurrent ? 'text-white' : isPast ? 'text-white/20' : 'text-white/35'}`}
                        style={isCurrent
                          ? { background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 0 16px rgba(249,115,22,0.4)' }
                          : { background: isPast ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isPast ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}` }}>
                        S{w.week}
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 mt-2" style={{ background: isCurrent ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)', minHeight: 16 }} />
                      )}
                    </div>
                    <div className={`flex-1 rounded-2xl p-4 mb-2 ${isPast ? 'opacity-45' : ''}`}
                      style={isCurrent
                        ? { background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-1">Semana {w.week}</p>
                      <p className={`text-sm font-bold leading-tight ${isCurrent ? 'text-white' : isPast ? 'text-white/30' : 'text-white/55'}`}>
                        {w.title}
                      </p>
                      {w.items.filter(Boolean).length > 0 && (
                        <ul className="space-y-1.5 mt-2.5">
                          {w.items.filter(Boolean).map((item, j) => (
                            <li key={j} className="flex gap-2 items-start">
                              <div className={`w-1 h-1 rounded-full mt-[7px] shrink-0 ${isCurrent ? 'bg-[#f97316]' : 'bg-white/15'}`} />
                              <span className={`text-[12px] leading-relaxed ${isCurrent ? 'text-white/65' : isPast ? 'text-white/20' : 'text-white/35'}`}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

        return (
          <div className="fixed inset-0 z-50" onClick={() => setRoadmapOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Drawer lateral — PC (md+) */}
            <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-[400px] flex-col drawer-anim"
              style={{ background: '#070f1f', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
              onClick={e => e.stopPropagation()}>
              <RoadmapContent />
            </div>

            {/* Sheet desde abajo — móvil */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 rounded-t-3xl sheet-roadmap-anim max-h-[85vh] flex flex-col"
              style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <RoadmapContent />
              <div style={{ height: 'env(safe-area-inset-bottom)' }} />
            </div>
          </div>
        )
      })()}

      </div>
    </>
  )
}
