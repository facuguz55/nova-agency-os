'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Square, Loader2, Plus, X, Flag, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task { id: string; title: string; status: string; priority: string; due_date?: string; assigned_to?: string }

const PRIORITY_COLOR: Record<string, string> = { urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-[#4a6080]' }
const PRIORITY_DOT:   Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-[#334155]' }
const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' }

export default function TareasMobilePage() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'pending' | 'done'>('pending')
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate]   = useState('')
  const [saving, setSaving]           = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleTask(t: Task) {
    const newStatus = t.status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x))
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  async function createTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), priority: newPriority, due_date: newDueDate || null, status: 'todo' }),
    })
    setNewTitle(''); setNewPriority('medium'); setNewDueDate('')
    setShowNew(false); setSaving(false); load()
  }

  const filtered = tasks.filter(t => filter === 'done' ? t.status === 'done' : t.status !== 'done')
  const pendingCount = tasks.filter(t => t.status !== 'done').length
  const urgentCount  = tasks.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high')).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 px-4 border-b border-[#1a2d45] bg-[#0c1628] flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: '12px' }}>
        <div>
          <p className="text-sm font-semibold text-white">Tareas</p>
          {pendingCount > 0 && <p className="text-[10px] text-[#4a6080] mt-0.5">{pendingCount} pendientes · {urgentCount > 0 ? `${urgentCount} urgentes` : 'sin urgentes'}</p>}
        </div>
        <button onClick={() => setShowNew(true)} className="w-8 h-8 bg-[#f97316] rounded-xl flex items-center justify-center active:bg-[#ea6c0a] transition-colors">
          <Plus size={16} className="text-white" />
        </button>
      </header>

      {/* Filtros */}
      <div className="shrink-0 flex px-4 pt-3 pb-2 gap-2">
        {(['pending', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('flex-1 py-2 rounded-xl text-xs font-semibold transition-colors', f === filter ? 'bg-[#f97316] text-white' : 'bg-[#0f1d30] border border-[#1a2d45] text-[#4a6080]')}>
            {f === 'pending' ? `Pendientes (${pendingCount})` : 'Completadas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#f97316]" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckSquare size={36} className="text-[#1a2d45]" />
            <p className="text-[#334155] text-sm">{filter === 'pending' ? 'Todo al día 🎉' : 'Sin completadas'}</p>
            {filter === 'pending' && (
              <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-[#f97316] text-white text-sm font-semibold rounded-xl active:bg-[#ea6c0a]">
                + Nueva tarea
              </button>
            )}
          </div>
        ) : filtered.map(t => (
          <div key={t.id} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex items-start gap-3 active:bg-[#152338] transition-colors">
            <button onClick={() => toggleTask(t)} className="shrink-0 mt-0.5">
              {t.status === 'done'
                ? <CheckSquare size={18} className="text-[#f97316]" />
                : <Square size={18} className="text-[#334155]" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium leading-snug', t.status === 'done' ? 'text-[#334155] line-through' : 'text-white')}>{t.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[t.priority])} />
                  <span className={cn('text-[10px] font-bold uppercase', PRIORITY_COLOR[t.priority])}>{PRIORITY_LABEL[t.priority]}</span>
                </div>
                {t.due_date && (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#4a6080]">
                    <Calendar size={9} />{new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </span>
                )}
                {t.assigned_to && <span className="text-[10px] text-[#4a6080]">{t.assigned_to}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sheet nueva tarea */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative w-full bg-[#0c1628] border-t border-[#1a2d45] rounded-t-3xl p-5 space-y-4" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 20px)` }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-bold text-white">Nueva tarea</p>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl bg-[#1a2d45] flex items-center justify-center text-[#64748b]">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#4a6080] uppercase tracking-widest block mb-2">Título *</label>
              <input
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="¿Qué hay que hacer?"
                autoFocus
                className="w-full px-4 py-3 bg-[#080f1e] border border-[#1a2d45] rounded-xl text-white placeholder-[#334155] text-sm focus:outline-none focus:border-[#f97316]/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#4a6080] uppercase tracking-widest block mb-2">Prioridad</label>
              <div className="flex gap-2">
                {['low','medium','high','urgent'].map(p => (
                  <button key={p} onClick={() => setNewPriority(p)}
                    className={cn('flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors', newPriority === p ? 'bg-[#f97316] text-white' : 'bg-[#080f1e] border border-[#1a2d45] text-[#4a6080]')}>
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[#4a6080] uppercase tracking-widest block mb-2 flex items-center gap-1">
                <Calendar size={10} /> Fecha límite (opcional)
              </label>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#080f1e] border border-[#1a2d45] rounded-xl text-white text-sm focus:outline-none focus:border-[#f97316]/50" />
            </div>

            <button onClick={createTask} disabled={saving || !newTitle.trim()}
              className="w-full py-3.5 bg-[#f97316] disabled:opacity-40 text-white font-bold rounded-xl text-sm active:bg-[#ea6c0a] transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Flag size={14} /> Crear tarea</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
