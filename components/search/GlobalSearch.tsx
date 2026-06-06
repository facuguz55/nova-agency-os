'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, FolderKanban, Zap, CheckSquare, FileText, BookOpen, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Result {
  type: string; label: string; sub: string; href: string
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  client:    { icon: <Users size={13}/>,       color: 'text-[var(--amber)]',  label: 'Cliente' },
  project:   { icon: <FolderKanban size={13}/>, color: 'text-purple-400', label: 'Proyecto' },
  automation:{ icon: <Zap size={13}/>,          color: 'text-blue-400',   label: 'Automatización' },
  task:      { icon: <CheckSquare size={13}/>,  color: 'text-green-400',  label: 'Tarea' },
  note:      { icon: <FileText size={13}/>,     color: 'text-yellow-400', label: 'Nota' },
  decision:  { icon: <BookOpen size={13}/>,     color: 'text-purple-400', label: 'Decisión' },
  action:    { icon: <ScrollText size={13}/>,   color: 'text-[var(--text-3)]', label: 'Acción' },
}

export default function GlobalSearch() {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Result[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setResults([]) }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const { results: data } = await res.json()
    setResults(data || [])
    setSelected(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  function navigate(href: string) {
    router.push(href); setOpen(false); setQuery('')
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setOpen(false)}/>

      <div
        className="relative w-full max-w-xl rounded-2xl shadow-[0_0_80px_rgba(0,0,0,.8)] overflow-hidden"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
      >
        {/* Top amber glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,158,11,0.4)] to-transparent"/>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={16} className="text-[var(--text-3)] shrink-0"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar clientes, proyectos, tareas, notas..."
            className="flex-1 bg-transparent text-white text-sm placeholder-[var(--text-4)] focus:outline-none"
          />
          {loading && <div className="w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin shrink-0"/>}
          <kbd
            className="text-[10px] text-[var(--text-4)] px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            ESC
          </kbd>
        </div>

        {results.length > 0 ? (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const meta = TYPE_META[r.type] || { icon: null, color: 'text-[var(--text-3)]', label: r.type }
              return (
                <button
                  key={i}
                  onClick={() => navigate(r.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === selected ? 'bg-[rgba(245,158,11,0.06)]' : 'hover:bg-white/[.02]',
                  )}
                >
                  <span className={cn('shrink-0', meta.color)}>{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{r.label}</p>
                    {r.sub && <p className="text-xs text-[var(--text-3)] truncate">{r.sub}</p>}
                  </div>
                  <span className="text-[10px] text-[var(--text-4)] shrink-0">{meta.label}</span>
                </button>
              )
            })}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-4)]">Sin resultados para &quot;{query}&quot;</p>
          </div>
        ) : query.length === 0 ? (
          <div className="py-5 px-4">
            <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest mb-2">Búsqueda rápida</p>
            <div className="flex flex-wrap gap-1.5">
              {['clientes', 'proyectos', 'tareas', 'notas', 'decisiones'].map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs px-2.5 py-1 rounded-lg text-[var(--text-3)] hover:text-white transition-all capitalize"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="px-4 py-2 flex gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[10px] text-[var(--text-4)]">↑↓ navegar</span>
          <span className="text-[10px] text-[var(--text-4)]">Enter seleccionar</span>
          <span className="text-[10px] text-[var(--text-4)]">Esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
