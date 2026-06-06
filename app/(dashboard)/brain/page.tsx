'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import { cn, formatDate } from '@/lib/utils'
import {
  Brain, Eye, Lightbulb, AlertTriangle, CheckCircle2, RefreshCw,
  ChevronDown, ChevronUp, Tag, Zap, Plus,
} from 'lucide-react'

interface Memory {
  id: string
  category: 'pattern' | 'decision' | 'lesson' | 'observation' | 'fact'
  title: string
  content: string
  tags: string[]
  confidence: number
  times_applied: number
  source: string
  created_at: string
}

interface Observation {
  id: string
  type: 'alert' | 'pattern' | 'insight' | 'recommendation'
  title: string
  content: string
  severity: 'info' | 'warning' | 'critical'
  resolved: boolean
  created_at: string
}

const CATEGORY_COLOR: Record<string, string> = {
  pattern:     'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  decision:    'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  lesson:      'bg-green-500/15 text-green-400 border border-green-500/20',
  observation: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  fact:        'bg-[var(--amber-dim)] text-[var(--amber)] border border-[var(--amber)]/20',
}

const SEVERITY_COLOR: Record<string, string> = {
  info:     'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  warning:  'bg-[var(--amber-dim)] text-[var(--amber)] border border-[var(--amber)]/20',
  critical: 'bg-red-500/15 text-red-400 border border-red-500/20',
}

const OBS_TYPE_ICON: Record<string, React.ReactNode> = {
  alert:          <AlertTriangle size={13} />,
  pattern:        <Zap size={13} />,
  insight:        <Lightbulb size={13} />,
  recommendation: <Eye size={13} />,
}

const CATEGORIES = ['Todos', 'pattern', 'decision', 'lesson', 'observation', 'fact'] as const

const EMPTY_MEMORY = {
  category: 'fact',
  title: '',
  content: '',
  tags: '',
  confidence: 50,
}

const CARD = { background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12 }

export default function BrainPage() {
  usePageTitle('Brain')
  const [memories,      setMemories]      = useState<Memory[]>([])
  const [observations,  setObservations]  = useState<Observation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('Todos')
  const [obsTab,        setObsTab]        = useState<'active' | 'resolved'>('active')
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [showModal,     setShowModal]     = useState(false)
  const [form,          setForm]          = useState(EMPTY_MEMORY)
  const [saving,        setSaving]        = useState(false)
  const [observing,     setObserving]     = useState(false)
  const [observeResult, setObserveResult] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [mRes, oRes] = await Promise.all([
      fetch('/api/brain/memory'),
      fetch('/api/brain/observations'),
    ])
    const [m, o] = await Promise.all([mRes.json(), oRes.json()])
    setMemories(Array.isArray(m) ? m : [])
    setObservations(Array.isArray(o) ? o : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const totalMemories     = memories.length
  const totalObservations = observations.length
  const unresolvedObs     = observations.filter(o => !o.resolved).length
  const topMemory         = [...memories].sort((a, b) => b.times_applied - a.times_applied)[0]

  const filteredMemories = activeCategory === 'Todos'
    ? memories
    : memories.filter(m => m.category === activeCategory)

  const filteredObs = observations.filter(o =>
    obsTab === 'active' ? !o.resolved : o.resolved
  )

  async function handleResolve(id: string) {
    await fetch(`/api/brain/observations/${id}`, { method: 'PATCH' })
    setObservations(prev => prev.map(o => o.id === id ? { ...o, resolved: true } : o))
  }

  async function handleObserve() {
    setObserving(true); setObserveResult(null)
    try {
      const res  = await fetch('/api/agent/observe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      setObserveResult(`${data.observations_created ?? 0} observaciones, ${data.memories_updated ?? 0} memorias — ${data.result ?? ''}`)
      await loadAll()
    } catch {
      setObserveResult('Error al correr el ciclo de observación.')
    }
    setObserving(false)
  }

  async function handleSaveMemory() {
    if (!form.title || !form.content) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await fetch('/api/brain/memory', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, tags, confidence: Number(form.confidence) }),
    })
    await loadAll(); setShowModal(false); setForm(EMPTY_MEMORY); setSaving(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <Header
        title="IA Brain"
        subtitle="Memoria y aprendizajes acumulados"
        actions={
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus size={15} /> Enseñarle algo
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total memorias',     value: totalMemories,     icon: <Brain size={16} className="text-[var(--amber)]" /> },
            { label: 'Total observaciones', value: totalObservations, icon: <Eye size={16} className="text-purple-400" /> },
            { label: 'Sin resolver',        value: unresolvedObs,     icon: <AlertTriangle size={16} className="text-yellow-400" /> },
            {
              label: 'Más aplicada',
              value: topMemory ? `${topMemory.title.slice(0, 18)}… (${topMemory.times_applied}x)` : '—',
              icon: <Zap size={16} className="text-green-400" />,
              small: true,
            },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3 p-4 rounded-xl" style={CARD}>
              <div className="shrink-0">{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest">{stat.label}</p>
                <p className={cn('font-semibold text-white truncate', stat.small ? 'text-sm' : 'text-xl')}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Observe result banner */}
        {observeResult && (
          <div className="px-4 py-3 text-sm text-[var(--amber)] rounded-xl"
            style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)' }}>
            {observeResult}
          </div>
        )}

        <div className="flex gap-5 items-start">

          {/* Left: Memories */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    activeCategory === cat
                      ? 'text-white'
                      : 'text-[var(--text-3)] hover:text-white',
                  )}
                  style={activeCategory === cat
                    ? { background: 'var(--amber)', border: '1px solid var(--amber)' }
                    : { background: 'var(--surface-0)', border: '1px solid var(--border)' }}
                >
                  {cat === 'Todos' ? 'Todos' : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-[var(--text-3)] text-sm py-8 text-center">Cargando memorias...</div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-[var(--text-3)] text-sm py-8 text-center">No hay memorias en esta categoría.</div>
            ) : (
              <div className="space-y-2">
                {filteredMemories.map(mem => {
                  const expanded = expandedId === mem.id
                  return (
                    <div key={mem.id} className="overflow-hidden rounded-xl" style={CARD}>
                      <button onClick={() => setExpandedId(expanded ? null : mem.id)}
                        className="w-full text-left p-4 flex items-start gap-3">
                        <span className={cn('shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5', CATEGORY_COLOR[mem.category])}>
                          {mem.category}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">{mem.title}</span>
                            {mem.times_applied > 0 && (
                              <span className="shrink-0 text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                                {mem.times_applied}x aplicada
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                              <div className="h-full rounded-full bg-gradient-to-r from-[var(--amber)] to-orange-500"
                                style={{ width: `${mem.confidence}%` }} />
                            </div>
                            <span className="text-[10px] text-[var(--text-3)] shrink-0">{mem.confidence}%</span>
                          </div>
                          {!expanded && (
                            <p className="text-xs text-[var(--text-3)] truncate">{mem.content.slice(0, 80)}</p>
                          )}
                          {mem.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {mem.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-0.5 text-[10px] text-[var(--text-3)] px-1.5 py-0.5 rounded"
                                  style={{ background: 'var(--surface-2)' }}>
                                  <Tag size={8} />{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-[var(--text-3)]">
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap">{mem.content}</p>
                          <p className="text-[10px] text-[var(--text-4)] mt-2">
                            {mem.source === 'manual' ? 'Enseñado manualmente' : `Via ${mem.source}`} · {formatDate(mem.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Observations */}
          <div className="w-72 shrink-0 space-y-3">
            <button onClick={handleObserve} disabled={observing}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                observing ? 'text-[var(--text-3)] cursor-not-allowed' : 'text-[var(--amber)] hover:bg-[var(--amber-dim)]',
              )}
              style={observing
                ? { border: '1px solid var(--border)' }
                : { border: '1px solid rgba(245,158,11,0.3)', background: 'var(--amber-dim)' }}
            >
              <RefreshCw size={14} className={observing ? 'animate-spin' : ''} />
              {observing ? 'Observando...' : 'Correr observación ahora'}
            </button>

            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['active', 'resolved'] as const).map(tab => (
                <button key={tab} onClick={() => setObsTab(tab)}
                  className="flex-1 py-2 text-xs font-medium transition-all"
                  style={obsTab === tab
                    ? { background: 'var(--amber)', color: '#000' }
                    : { background: 'var(--surface-0)', color: 'var(--text-3)' }}
                >
                  {tab === 'active' ? `Activas (${unresolvedObs})` : 'Resueltas'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-[var(--text-3)] text-xs text-center py-4">Cargando...</div>
            ) : filteredObs.length === 0 ? (
              <div className="text-[var(--text-3)] text-xs text-center py-4 rounded-xl" style={CARD}>
                No hay observaciones {obsTab === 'active' ? 'activas' : 'resueltas'}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredObs.map(obs => (
                  <div key={obs.id} className="rounded-xl p-3 space-y-2" style={CARD}>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[var(--text-3)]">{OBS_TYPE_ICON[obs.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{obs.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', SEVERITY_COLOR[obs.severity])}>
                            {obs.severity}
                          </span>
                          <span className="text-[10px] text-[var(--text-3)]">{formatDate(obs.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-3)] leading-relaxed">{obs.content}</p>
                    {!obs.resolved && (
                      <button onClick={() => handleResolve(obs.id)}
                        className="flex items-center gap-1.5 text-[10px] text-green-400 hover:text-green-300 transition-colors">
                        <CheckCircle2 size={11} /> Marcar resuelta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Enseñarle algo a Nova AI">
        <div className="space-y-4">
          <Select label="Categoría" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="fact">Hecho</option>
            <option value="pattern">Patrón</option>
            <option value="lesson">Lección</option>
            <option value="observation">Observación</option>
            <option value="decision">Decisión</option>
          </Select>
          <Input label="Título" placeholder="Título corto y descriptivo" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Contenido" placeholder="Descripción detallada del aprendizaje..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
          <Input label="Tags (separados por coma)" placeholder="cliente, facturación, marketing" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Confianza: {form.confidence}%
            </label>
            <input type="range" min={0} max={100} value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
              className="w-full accent-[var(--amber)]" />
            <div className="flex justify-between text-[10px] text-[var(--text-3)] mt-0.5">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveMemory} disabled={saving || !form.title || !form.content}>
              {saving ? 'Guardando...' : 'Guardar aprendizaje'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
