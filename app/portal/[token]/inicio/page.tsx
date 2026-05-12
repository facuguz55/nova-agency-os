'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, CheckSquare, FileText, ExternalLink, Calendar, AlertCircle } from 'lucide-react'

interface PortalData {
  client: { id: string; name: string; email: string | null; industry: string | null; contact_person: string | null; notes: string | null }
  projects: Array<{ id: string; name: string; status: string; budget: number | null; created_at: string }>
  tasks: Array<{ id: string; title: string; status: string; priority: string; due_date: string | null; assigned_to: string | null }>
  reports: Array<{ id: string; title: string; period: string; created_at: string }>
}

const STATUS_LABEL: Record<string, string> = { active: 'Activo', completed: 'Completado', paused: 'Pausado', planning: 'Planificando' }
const STATUS_COLOR: Record<string, string> = { active: 'text-emerald-400 bg-emerald-400/10', completed: 'text-[#64748b] bg-[#1a2d45]', paused: 'text-yellow-400 bg-yellow-400/10', planning: 'text-blue-400 bg-blue-400/10' }
const PRIORITY_COLOR: Record<string, string> = { urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-[#64748b]' }

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
      <div className="w-8 h-8 rounded-xl bg-[#f97316] animate-pulse flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
      </div>
    </div>
  )

  if (!data) return null
  const { client, projects, tasks, reports } = data

  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      {/* Header */}
      <header className="bg-[#0d1b2e] border-b border-[#1a2d45] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f97316] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-xs text-[#4a6080]">Portal de cliente</p>
            <p className="text-sm font-semibold text-white">{client.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/portal/${token}/bienvenida`} className="text-xs text-[#f97316] hover:text-[#fb923c] flex items-center gap-1 px-3 py-1.5 border border-[#f97316]/30 rounded-lg">
            <ExternalLink size={10} /> Bienvenida
          </Link>
          {reports.length > 0 && (
            <Link href={`/portal/${token}/reportes`} className="text-xs text-[#64748b] hover:text-white flex items-center gap-1 px-3 py-1.5 border border-[#1a2d45] rounded-lg">
              <FileText size={10} /> Reportes
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proyectos', value: projects.length, sub: `${projects.filter(p => p.status === 'active').length} activos`, Icon: FolderKanban, color: 'text-[#f97316]' },
            { label: 'Tareas', value: tasks.length, sub: 'en progreso', Icon: CheckSquare, color: 'text-blue-400' },
            { label: 'Reportes', value: reports.length, sub: 'disponibles', Icon: FileText, color: 'text-emerald-400' },
          ].map(({ label, value, sub, Icon, color }) => (
            <div key={label} className="bg-[#0d1b2e] border border-[#1a2d45] rounded-xl p-4">
              <Icon size={14} className={color} />
              <p className="text-2xl font-bold text-white mt-2">{value}</p>
              <p className="text-xs text-[#4a6080]">{label}</p>
              <p className="text-[10px] text-[#2a3f58]">{sub}</p>
            </div>
          ))}
        </div>

        {/* Proyectos */}
        {projects.length > 0 && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45]">
              <h2 className="text-xs font-semibold text-[#64748b] flex items-center gap-2"><FolderKanban size={12} /> Proyectos</h2>
            </div>
            <div className="divide-y divide-[#1a2d45]">
              {projects.map(p => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    {p.budget && <p className="text-xs text-[#4a6080]">Presupuesto: ${Number(p.budget).toLocaleString('es-AR')}</p>}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[p.status] || 'text-[#64748b] bg-[#1a2d45]'}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tareas en progreso */}
        {tasks.length > 0 && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1a2d45]">
              <h2 className="text-xs font-semibold text-[#64748b] flex items-center gap-2"><CheckSquare size={12} /> Tareas activas</h2>
            </div>
            <div className="divide-y divide-[#1a2d45]">
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                  <AlertCircle size={12} className={PRIORITY_COLOR[t.priority] || 'text-[#64748b]'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t.title}</p>
                    {t.due_date && (
                      <p className="text-[11px] text-[#4a6080] flex items-center gap-1">
                        <Calendar size={9} /> {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                  {t.assigned_to && <span className="text-[10px] text-[#2a3f58]">{t.assigned_to}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas del cliente */}
        {client.notes && (
          <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-xl p-5">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Notas</p>
            <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}

      </div>
    </div>
  )
}
