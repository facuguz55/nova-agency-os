'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Square, Loader2 } from 'lucide-react'

interface Task {
  id: string; title: string; status: string; priority: string
  due_date?: string; assigned_to?: string
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-red-400',
  high:   'text-orange-400',
  medium: 'text-yellow-400',
  low:    'text-[#4a6080]',
}

export default function TareasMobilePage() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'pending' | 'done'>('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data.tasks || data || [])
    setLoading(false)
  }

  async function toggleTask(t: Task) {
    const newStatus = t.status === 'done' ? 'todo' : 'done'
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x))
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const filtered = tasks.filter(t => filter === 'done' ? t.status === 'done' : t.status !== 'done')
  const pendingCount = tasks.filter(t => t.status !== 'done').length

  return (
    <div className="flex flex-col h-full">
      <header
        className="shrink-0 px-4 border-b border-[#1a2d45] bg-[#0c1628] flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: '12px' }}
      >
        <p className="text-sm font-semibold text-white">Tareas</p>
        {pendingCount > 0 && (
          <span className="text-[10px] bg-[#f97316] text-white font-bold px-1.5 py-0.5 rounded-full ml-2">{pendingCount}</span>
        )}
      </header>

      {/* Filter tabs */}
      <div className="shrink-0 flex px-4 pt-3 pb-2 gap-2">
        {(['pending', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#f97316] text-white'
                : 'bg-[#0f1d30] border border-[#1a2d45] text-[#4a6080]'
            }`}
          >
            {f === 'pending' ? 'Pendientes' : 'Completadas'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#f97316]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckSquare size={36} className="text-[#1a2d45]" />
            <p className="text-[#334155] text-sm">
              {filter === 'pending' ? 'Todo al día 🎉' : 'Sin completadas'}
            </p>
            {filter === 'pending' && (
              <p className="text-xs text-[#334155]">Creá tareas desde la versión desktop</p>
            )}
          </div>
        ) : filtered.map(t => (
          <div key={t.id} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex items-start gap-3">
            <button onClick={() => toggleTask(t)} className="shrink-0 mt-0.5">
              {t.status === 'done'
                ? <CheckSquare size={18} className="text-[#f97316]" />
                : <Square size={18} className="text-[#334155]" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${t.status === 'done' ? 'text-[#334155] line-through' : 'text-white'}`}>
                {t.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-semibold uppercase ${PRIORITY_COLOR[t.priority] || 'text-[#4a6080]'}`}>
                  {t.priority}
                </span>
                {t.due_date && (
                  <span className="text-[10px] text-[#334155]">
                    {new Date(t.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </span>
                )}
                {t.assigned_to && (
                  <span className="text-[10px] text-[#334155]">{t.assigned_to}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
