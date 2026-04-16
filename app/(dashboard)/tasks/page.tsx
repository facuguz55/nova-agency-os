'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Calendar, Flag, GripVertical, Trash2 } from 'lucide-react'

interface Task {
  id: string; title: string; description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null; due_date: string | null
  projects: { name: string } | null; clients: { name: string } | null
  created_at: string
}
interface Client  { id: string; name: string }
interface Project { id: string; name: string }

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'todo',        label: 'Por hacer',   color: 'text-[#64748b]' },
  { key: 'in_progress', label: 'En progreso', color: 'text-blue-400'  },
  { key: 'review',      label: 'En revisión', color: 'text-yellow-400' },
  { key: 'done',        label: 'Listo',       color: 'text-green-400' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-[#475569]',
  medium: 'text-blue-400',
  high:   'text-orange-400',
  urgent: 'text-red-400',
}

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', project_id: '', client_id: '', due_date: '' }

export default function TasksPage() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [view, setView]       = useState<'kanban' | 'list'>('kanban')

  async function load() {
    setLoading(true)
    const [tRes, cRes, pRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/clients'),
      fetch('/api/projects'),
    ])
    const [t, c, p] = await Promise.all([tRes.json(), cRes.json(), pRes.json()])
    setTasks(t.tasks || [])
    setClients(c.clients || [])
    setProjects(p.projects || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, project_id: form.project_id || null, client_id: form.client_id || null, due_date: form.due_date || null }),
    })
    setShowModal(false); setForm(EMPTY); setSaving(false); load()
  }

  async function moveTask(id: string, newStatus: Task['status']) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    setTasks(t => t.map(task => task.id === id ? { ...task, status: newStatus } : task))
  }

  async function deleteTask(id: string) {
    if (!confirm('¿Eliminar tarea?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  const byStatus = (status: Task['status']) => tasks.filter(t => t.status === status)
  const dueSoon  = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= new Date(Date.now() + 3 * 86400000))

  return (
    <>
      <Header
        title="Tareas"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} pendientes`}
        actions={
          <div className="flex gap-2">
            <div className="flex bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl overflow-hidden">
              {(['kanban','list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 text-xs capitalize transition-colors', view === v ? 'bg-[#ff8c42]/20 text-[#ff8c42]' : 'text-[#475569] hover:text-white')}>
                  {v === 'kanban' ? 'Kanban' : 'Lista'}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowModal(true)} size="sm"><Plus size={13}/> Nueva tarea</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto bg-grid">
        {/* Alertas de vencimiento */}
        {dueSoon.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-400 flex items-center gap-2">
            <Flag size={14}/>
            {dueSoon.length} tarea{dueSoon.length > 1 ? 's' : ''} vence{dueSoon.length === 1 ? '' : 'n'} pronto: {dueSoon.map(t => t.title).join(', ')}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : view === 'kanban' ? (
          /* ── KANBAN ── */
          <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn('text-xs font-bold uppercase tracking-widest', col.color)}>{col.label}</h3>
                  <span className="text-xs text-[#334155] bg-[#0e1a2e] border border-[#1e2f4a] rounded-full px-2 py-0.5">{byStatus(col.key).length}</span>
                </div>

                <div className="flex flex-col gap-2 min-h-[200px]">
                  {byStatus(col.key).map(task => (
                    <div key={task.id} className="bg-[#0e1a2e] border border-[#1e2f4a] hover:border-[#2a4166] rounded-xl p-3 group transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[#334155] hover:text-red-400 transition-all shrink-0">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                      {task.description && <p className="text-xs text-[#475569] mb-2 line-clamp-2">{task.description}</p>}

                      <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-[10px] font-bold uppercase', PRIORITY_COLOR[task.priority])}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-[10px] text-[#475569] flex items-center gap-1">
                            <Calendar size={9}/>{formatDate(task.due_date).split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {(task.projects || task.clients) && (
                        <p className="text-[10px] text-[#334155] mt-1.5 truncate">
                          {task.projects?.name || task.clients?.name}
                        </p>
                      )}

                      {/* Move buttons */}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key} onClick={() => moveTask(task.id, c.key)}
                            className={cn('text-[9px] px-1.5 py-0.5 rounded-md border transition-colors', c.color, 'border-current/20 hover:bg-white/5')}>
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {byStatus(col.key).length === 0 && (
                    <div className="border border-dashed border-[#1e2f4a] rounded-xl p-4 text-center">
                      <p className="text-xs text-[#1e2f4a]">Vacío</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST ── */
          <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2f4a]">
                  {['Tarea', 'Estado', 'Prioridad', 'Asignado', 'Vence', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] text-[#334155] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="border-b border-[#1e2f4a]/40 hover:bg-white/[.015] transition-colors last:border-0">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      {(t.projects || t.clients) && <p className="text-xs text-[#334155]">{t.projects?.name || t.clients?.name}</p>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={t.status}/></td>
                    <td className="px-5 py-3"><span className={cn('text-xs font-bold uppercase', PRIORITY_COLOR[t.priority])}>{t.priority}</span></td>
                    <td className="px-5 py-3 text-sm text-[#475569]">{t.assigned_to || '—'}</td>
                    <td className="px-5 py-3 text-xs text-[#475569]">{t.due_date ? formatDate(t.due_date).split(' ')[0] : '—'}</td>
                    <td className="px-3">
                      <button onClick={() => deleteTask(t.id)} className="text-[#334155] hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva tarea">
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Diseñar landing page" />
          <Textarea label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="done">Listo</option>
            </Select>
            <Select label="Prioridad" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Proyecto" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
              <option value="">Sin proyecto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select label="Cliente" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Sin cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Asignado a" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Facundo / Mauricio" />
            <Input label="Fecha límite" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} type="date" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Guardando...' : 'Crear tarea'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
