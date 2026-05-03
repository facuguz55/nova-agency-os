'use client'

import { useEffect, useState } from 'react'
import { Plus, FolderKanban, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'

interface Project { id: string; name: string; status: string; client_name?: string; description?: string }

export default function ProyectosMobilePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || d || []); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <header
        className="shrink-0 px-4 border-b border-[#1a2d45] bg-[#0c1628] flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: '12px' }}
      >
        <p className="text-sm font-semibold text-white">Proyectos</p>
        <a href="/projects" className="text-xs text-[#f97316]">Ver todos →</a>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#f97316]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderKanban size={36} className="text-[#1a2d45]" />
            <p className="text-[#334155] text-sm">Sin proyectos</p>
            <a href="/projects" className="text-xs text-[#f97316] flex items-center gap-1">
              <Plus size={12} /> Crear proyecto
            </a>
          </div>
        ) : projects.map(p => (
          <a key={p.id} href={`/projects/${p.id}`} className="block bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 active:bg-[#152338] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white leading-tight">{p.name}</p>
              <StatusBadge status={p.status} />
            </div>
            {p.client_name && (
              <p className="text-xs text-[#4a6080] mt-1.5">{p.client_name}</p>
            )}
            {p.description && (
              <p className="text-xs text-[#334155] mt-1 line-clamp-1">{p.description}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
