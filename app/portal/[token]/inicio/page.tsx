'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ExternalLink } from 'lucide-react'

interface PortalData {
  client: { id: string; name: string; email: string | null; industry: string | null; contact_person: string | null; notes: string | null }
  projects: Array<{ id: string; name: string; status: string; budget: number | null; created_at: string }>
  tasks: Array<{ id: string; title: string; status: string; priority: string; due_date: string | null; assigned_to: string | null }>
  reports: Array<{ id: string; title: string; period: string; created_at: string }>
}

const STATUS_LABEL: Record<string, string> = { active: 'En curso', completed: 'Completado', paused: 'Pausado', planning: 'Planificando' }
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed: 'bg-[#1a2d45] text-[#64748b] border border-[#1a2d45]',
  paused: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  planning: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}
const PRIORITY_DOT: Record<string, string> = { urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-[#4a6080]' }

function ProgressBar({ value, total, color = '#f97316' }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="w-full bg-[#1a2d45] rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
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
        if (r.status === 401 || r.status === 404) { localStorage.removeItem(`portal_pin_${token}`); router.replace(`/portal/${token}`); return null }
        return r.json()
      })
      .then(json => { if (json) setData(json) })
      .finally(() => setLoading(false))
  }, [token, router])

  if (loading) return (
    <div className="min-h-screen bg-[#060d18] flex items-center justify-center">
      <Image src="/logo-nova-clear.png" alt="Nova Agency" width={100} height={40} className="object-contain animate-pulse opacity-60" />
    </div>
  )

  if (!data) return null
  const { client, projects, tasks, reports } = data

  const activeProjects = projects.filter(p => p.status === 'active')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-[#060d18] text-white">

      {/* Header */}
      <header className="bg-[#0a1628]/80 backdrop-blur border-b border-[#1a2d45]/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Image src="/logo-nova-clear.png" alt="Nova Agency" width={100} height={36} className="object-contain" />
        <div className="flex items-center gap-2">
          <Link href={`/portal/${token}/bienvenida`} className="text-[11px] text-[#f97316] hover:text-[#fb923c] flex items-center gap-1.5 px-3 py-1.5 border border-[#f97316]/30 hover:border-[#f97316]/60 rounded-lg transition-colors">
            <ExternalLink size={10} /> Bienvenida
          </Link>
          {reports.length > 0 && (
            <Link href={`/portal/${token}/reportes`} className="text-[11px] text-[#64748b] hover:text-white flex items-center gap-1.5 px-3 py-1.5 border border-[#1a2d45] hover:border-[#253f60] rounded-lg transition-colors">
              <FileText size={10} /> Reportes
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* Saludo */}
        <div>
          <p className="text-[#4a6080] text-sm">{greeting},</p>
          <h1 className="text-2xl font-black text-white">{client.name}</h1>
          {client.industry && <p className="text-[#64748b] text-sm mt-0.5">{client.industry}</p>}
        </div>

        {/* Resumen visual */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Proyectos totales', value: projects.length, color: 'text-[#f97316]', bg: 'bg-[#f97316]/5 border-[#f97316]/20' },
            { label: 'En curso', value: activeProjects.length, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { label: 'Completados', value: completedProjects.length, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-[#4a6080] mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Progreso global */}
        {projects.length > 0 && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Progreso general</p>
              <p className="text-sm font-bold text-white">{completedProjects.length}/{projects.length}</p>
            </div>
            <ProgressBar value={completedProjects.length} total={projects.length} />
            <p className="text-[11px] text-[#2a3f58] mt-2">
              {completedProjects.length === 0
                ? 'Proyectos en marcha'
                : completedProjects.length === projects.length
                ? '¡Todo completado!'
                : `${projects.length - completedProjects.length} proyecto${projects.length - completedProjects.length !== 1 ? 's' : ''} en progreso`}
            </p>
          </div>
        )}

        {/* Proyectos */}
        {projects.length > 0 && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Tus proyectos</p>
            </div>
            <div className="divide-y divide-[#1a2d45]/60">
              {projects.map(p => {
                const tasksDone = tasks.filter(t => t.status === 'completed').length
                const tasksTotal = tasks.length
                return (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#f97316] font-black text-base">{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      {p.budget && (
                        <p className="text-[11px] text-[#4a6080]">Inversión: ${Number(p.budget).toLocaleString('es-AR')}</p>
                      )}
                      {p.status === 'active' && tasksTotal > 0 && (
                        <div className="mt-1.5">
                          <ProgressBar value={tasksDone} total={tasksTotal} color="#10b981" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[p.status] || 'bg-[#1a2d45] text-[#64748b]'}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tareas activas */}
        {tasks.length > 0 && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Trabajo en curso</p>
            </div>
            <div className="divide-y divide-[#1a2d45]/60">
              {tasks.slice(0, 6).map(t => (
                <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] || 'bg-[#4a6080]'}`} />
                  <p className="text-sm text-[#cbd5e1] flex-1 truncate">{t.title}</p>
                  {t.due_date && (
                    <p className="text-[11px] text-[#4a6080] shrink-0">
                      {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacto */}
        <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-4">Tu equipo</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Facundo Guzmán', role: 'Desarrollo & Automatización', wa: '549424633285' },
              { name: 'Mauricio Kinkela', role: 'Estrategia & Operaciones', wa: '5493424484572' },
            ].map(m => (
              <a
                key={m.name}
                href={`https://wa.me/${m.wa}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1.5 p-3.5 bg-[#060d18] border border-[#1a2d45] hover:border-[#253f60] rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                  <span className="text-[#f97316] font-bold text-sm">{m.name.charAt(0)}</span>
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-[#f97316] transition-colors">{m.name}</p>
                <p className="text-[11px] text-[#4a6080]">{m.role}</p>
                <span className="text-[11px] text-emerald-400 font-medium">Escribir por WhatsApp →</span>
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#1e3a5f] pb-4">
          Nova Agency · <a href="https://instagram.com/novaagencytec" target="_blank" rel="noreferrer" className="hover:text-[#f97316] transition-colors">@novaagencytec</a>
        </p>

      </div>
    </div>
  )
}
