'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Lightbulb, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils'

interface Idea {
  id: string; title: string; description: string | null
  status: 'pendiente' | 'en_proceso' | 'implementada' | 'descartada'
  created_at: string
}

const STATUS_LIST = [
  { key: 'pendiente',    label: 'Pendiente',    dot: 'bg-[var(--text-3)]',   chip: 'text-[var(--text-3)] bg-white/5 border-white/10' },
  { key: 'en_proceso',   label: 'En proceso',   dot: 'bg-blue-400',          chip: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { key: 'implementada', label: 'Implementada', dot: 'bg-emerald-400',       chip: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { key: 'descartada',   label: 'Descartada',   dot: 'bg-red-400/50',        chip: 'text-red-400/70 bg-red-400/5 border-red-400/15' },
]

const CARD = { background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12 }

function StatusPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = STATUS_LIST.find(s => s.key === value) || STATUS_LIST[0]

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${current.chip}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        {current.label}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 py-1"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          {STATUS_LIST.map(s => (
            <button
              key={s.key}
              onClick={() => { onChange(s.key); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-white/5 ${s.key === value ? 'text-white' : 'text-[var(--text-3)]'}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function IdeasPage() {
  usePageTitle('Ideas')
  const supabase = createClient()
  const [ideas, setIdeas]     = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [adding, setAdding]   = useState(false)
  const [addError, setAddError] = useState('')
  const [filter, setFilter]   = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .not('title', 'eq', '')
      .not('title', 'is', null)
      .order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  async function cleanEmpty() {
    await supabase.from('ideas').delete().or('title.eq.,title.is.null')
    load()
  }

  useEffect(() => { load(); }, [])

  async function add() {
    if (!title.trim()) return
    setAdding(true)
    setAddError('')
    let { error } = await supabase
      .from('ideas')
      .insert({ title: title.trim(), description: desc.trim() || null, status: 'pendiente' })
    if (error?.message.includes('description')) {
      const retry = await supabase
        .from('ideas')
        .insert({ title: title.trim(), status: 'pendiente' })
      error = retry.error
    }
    if (error) {
      setAddError(`No se pudo guardar: ${error.message}`)
      setAdding(false)
      return
    }
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
  const counts = {
    total:        ideas.length,
    pendiente:    ideas.filter(i => i.status === 'pendiente').length,
    en_proceso:   ideas.filter(i => i.status === 'en_proceso').length,
    implementada: ideas.filter(i => i.status === 'implementada').length,
  }

  return (
    <>
      <Header
        title="Ideas"
        subtitle={`${counts.total} idea${counts.total !== 1 ? 's' : ''}`}
        actions={
          counts.total !== ideas.length || ideas.some(i => !i.title) ? (
            <button onClick={cleanEmpty} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
              Limpiar vacías
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto max-w-3xl mx-auto w-full bg-grid">

        {/* Caja de captura rápida */}
        <div className="p-5 space-y-3 rounded-2xl" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={14} className="text-[var(--amber)]" />
            <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-widest">Nueva idea</p>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() } }}
            placeholder="¿Qué se te ocurrió?"
            className="w-full bg-transparent text-white text-base font-semibold placeholder-[var(--text-4)] focus:outline-none"
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Detalle opcional..."
            rows={2}
            className="w-full bg-transparent text-sm text-[var(--text-3)] placeholder-[var(--text-4)] focus:outline-none resize-none"
          />
          {addError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{addError}</p>
          )}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] text-[var(--text-4)]">Enter para guardar</p>
            <button
              onClick={add}
              disabled={adding || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors hover:opacity-90"
              style={{ background: 'var(--amber)' }}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f.key ? 'bg-[var(--amber-dim)] border-[var(--amber)]/30 text-[var(--amber)]' : 'text-[var(--text-3)] hover:text-white'}`}
              style={filter === f.key ? {} : { background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Lightbulb size={32} className="text-[var(--text-4)]"/>
            <p className="text-sm text-[var(--text-3)]">No hay ideas todavía</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(idea => (
              <div key={idea.id}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl group transition-colors ${idea.status === 'descartada' ? 'opacity-50' : ''}`}
                style={CARD}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${STATUS_LIST.find(s => s.key === idea.status)?.dot || 'bg-[var(--text-3)]'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${idea.status === 'descartada' ? 'line-through text-[var(--text-3)]' : 'text-white'}`}>{idea.title}</p>
                  {idea.description && <p className="text-xs text-[var(--text-3)] mt-1 leading-relaxed">{idea.description}</p>}
                  <p className="text-[10px] text-[var(--text-4)] mt-1.5">{formatRelative(idea.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPicker value={idea.status} onChange={v => setStatus(idea.id, v)} />
                  <button onClick={() => del(idea.id)} className="p-1 text-[var(--text-4)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
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
