'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Lightbulb, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils'

interface Idea {
  id: string; title: string; description: string | null
  status: 'pendiente' | 'en_proceso' | 'implementada' | 'descartada'
  created_at: string
}

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pendiente:    { label: 'Pendiente',    color: 'text-[#64748b] bg-[#1a2d45] border-[#253f60]',                dot: 'bg-[#334155]' },
  en_proceso:   { label: 'En proceso',   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',             dot: 'bg-blue-400' },
  implementada: { label: 'Implementada', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',    dot: 'bg-emerald-400' },
  descartada:   { label: 'Descartada',   color: 'text-red-400/60 bg-red-400/5 border-red-400/15',              dot: 'bg-red-400/50' },
}

export default function IdeasPage() {
  usePageTitle('Ideas')
  const supabase = createClient()
  const [ideas, setIdeas]     = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [adding, setAdding]   = useState(false)
  const [filter, setFilter]   = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim()) return
    setAdding(true)
    await supabase.from('ideas').insert({ title: title.trim(), description: desc.trim() || null, status: 'pendiente' })
    setTitle(''); setDesc(''); setAdding(false); load()
  }

  async function setStatus(id: string, status: string) {
    await supabase.from('ideas').update({ status }).eq('id', id)
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: status as Idea['status'] } : i))
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar idea?')) return
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const filtered = filter ? ideas.filter(i => i.status === filter) : ideas
  const counts = { total: ideas.length, pendiente: ideas.filter(i => i.status === 'pendiente').length, en_proceso: ideas.filter(i => i.status === 'en_proceso').length, implementada: ideas.filter(i => i.status === 'implementada').length }

  return (
    <>
      <Header title="Ideas" subtitle={`${counts.total} ideas · ${counts.implementada} implementadas`} />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto max-w-3xl mx-auto w-full">

        {/* Caja de captura rápida */}
        <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={14} className="text-[#f97316]" />
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Nueva idea</p>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() } }}
            placeholder="¿Qué se te ocurrió?"
            className="w-full bg-transparent text-white text-base font-semibold placeholder-[#253f60] focus:outline-none"
            autoFocus
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Detalle opcional..."
            rows={2}
            className="w-full bg-transparent text-sm text-[#64748b] placeholder-[#1e2f4a] focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between pt-1 border-t border-[#1a2d45]">
            <p className="text-[10px] text-[#253f60]">Enter para guardar</p>
            <button
              onClick={add}
              disabled={adding || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Plus size={12}/> Guardar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: '', label: `Todas (${counts.total})` },
            { key: 'pendiente', label: `Pendiente (${counts.pendiente})` },
            { key: 'en_proceso', label: `En proceso (${counts.en_proceso})` },
            { key: 'implementada', label: `Implementadas (${counts.implementada})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f.key ? 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]' : 'bg-[#0f1d30] border-[#1a2d45] text-[#64748b] hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Lightbulb size={32} className="text-[#1a2d45]"/>
            <p className="text-sm text-[#475569]">No hay ideas acá todavía</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(idea => (
              <div key={idea.id}
                className={`bg-[#0f1d30] border border-[#1a2d45] rounded-xl px-4 py-3.5 flex items-start gap-3 group transition-colors hover:border-[#253f60] ${idea.status === 'descartada' ? 'opacity-50' : ''}`}>
                {/* Dot */}
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS[idea.status]?.dot}`} />

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${idea.status === 'descartada' ? 'line-through text-[#475569]' : 'text-white'}`}>{idea.title}</p>
                  {idea.description && <p className="text-xs text-[#4a6080] mt-1 leading-relaxed">{idea.description}</p>}
                  <p className="text-[10px] text-[#253f60] mt-2">{formatRelative(idea.created_at)}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Selector de estado */}
                  <div className="relative">
                    <select
                      value={idea.status}
                      onChange={e => setStatus(idea.id, e.target.value)}
                      className={`text-[10px] font-bold pl-2 pr-5 py-1 rounded-full border appearance-none cursor-pointer focus:outline-none transition-colors ${STATUS[idea.status]?.color}`}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="implementada">Implementada</option>
                      <option value="descartada">Descartada</option>
                    </select>
                    <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"/>
                  </div>
                  <button onClick={() => del(idea.id)} className="p-1.5 text-[#253f60] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
