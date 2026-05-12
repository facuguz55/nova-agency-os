'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Calendar, Flag, Trash2, Pencil } from 'lucide-react'

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

const COLUMNS: { key: Task['status']; label: string; color: string; dot: string }[] = [
  { key: 'todo',        label: 'Por hacer',   color: 'text-[#64748b]',  dot: 'bg-[#334155]'  },
  { key: 'in_progress', label: 'En progreso', color: 'text-blue-400',   dot: 'bg-blue-400'   },
  { key: 'review',      label: 'En revisión', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  { key: 'done',        label: 'Listo',       color: 'text-emerald-400',dot: 'bg-emerald-400'},
]

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-[#475569]',
  medium: 'text-blue-400',
  high:   'text-orange-400',
  urgent: 'text-red-400',
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' }

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', project_id: '', client_id: '', due_date: '' }

type EditForm = {
  title: string; description: string; status: string; priority: string
  assigned_to: string; project_id: string; client_id: string; due_date: string
}

export default function TasksPage() {
  const [tasks, setTasks]       = useState<Task[]>([])
  const [clients, setClients]   = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]   = useState<Task | null>(null)
  const [form, setForm]         = useState<EditForm>(EMPTY)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [view, setView]         = useState<'kanban' | 'list'>('kanban')

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

  function openEdit(task: Task) {
    setEditForm({
      title:       task.title,
      description: task.description || '',
      status:      task.status,
      priority:    task.priority,
      assigned_to: task.assigned_to || '',
      project_id:  '',
      client_id:   '',
      due_date:    task.due_date ? task.due_date.slice(0, 10) : '',
    })
    setEditing(task)
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/tasks/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       editForm.title,
        description: editForm.description || null,
        status:      editForm.status,
        priority:    editForm.priority,
        assigned_to: editForm.assigned_to || null,
        due_date:    editForm.due_date || null,
      }),
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  async function create() {
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, project_id: form.project_id || null, client_id: form.client_id || null, due_date: form.due_date || null }),
    })
    setShowCreate(false); setForm(EMPTY); setSaving(false); load()
  }

  async function moveTask(id: string, newStatus: Task['status']) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    setTasks(t => t.map(task => task.id === id ? { ...task, status: newStatus } : task))
  }

  async function deleteTask(id: string) {
    if (!confirm('¿Eliminar tarea?')) return
    if (editing?.id === id) setEditing(null)
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
            <Button onClick={() => setShowCreate(true)} size="sm"><Plus size={13}/> Nueva tarea</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto bg-grid">
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
          <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full', col.dot)} />
                    <h3 className={cn('text-xs font-bold uppercase tracking-widest', col.color)}>{col.label}</h3>
                  </div>
                  <span className="text-xs text-[#334155] bg-[#0e1a2e] border border-[#1e2f4a] rounded-full px-2 py-0.5">{byStatus(col.key).length}</span>
                </div>

                <div className="flex flex-col gap-2 min-h-[200px]">
                  {byStatus(col.key).map(task => (
                    <div
                      key={task.id}
                      onClick={() => openEdit(task)}
                      className="bg-[#0e1a2e] border border-[#1e2f4a] hover:border-[#2a4166] rounded-xl p-3 group transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-white leading-snug flex-1">{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(task) }}
                            className="text-[#334155] hover:text-[#f97316] transition-colors"
                          >
                            <Pencil size={11}/>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                            className="text-[#334155] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </div>
                      {task.description && <p className="text-xs text-[#475569] mb-2 line-clamp-2">{task.description}</p>}

                      <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-[10px] font-bold uppercase', PRIORITY_COLOR[task.priority])}>
                          {PRIORITY_LABEL[task.priority]}
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

                      {task.assigned_to && (
                        <p className="text-[10px] text-[#4a6080] mt-1">{task.assigned_to}</p>
                      )}

                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
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
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="border-b border-[#1e2f4a]/40 hover:bg-white/[.015] transition-colors last:border-0 cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      {(t.projects || t.clients) && <p className="text-xs text-[#334155]">{t.projects?.name || t.clients?.name}</p>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={t.status}/></td>
                    <td className="px-5 py-3"><span className={cn('text-xs font-bold uppercase', PRIORITY_COLOR[t.priority])}>{PRIORITY_LABEL[t.priority]}</span></td>
                    <td className="px-5 py-3 text-sm text-[#475569]">{t.assigned_to || '—'}</td>
                    <td className="px-5 py-3 text-xs text-[#475569]">{t.due_date ? formatDate(t.due_date).split(' ')[0] : '—'}</td>
                    <td className="px-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteTask(t.id)} className="text-[#334155] hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: crear tarea */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarea">
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
            <Button onClick={create} disabled={saving || !form.title}>{saving ? 'Guardando...' : 'Crear tarea'}</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: editar tarea */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tarea">
        <div className="space-y-4">
          <Input label="Título *" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Descripción" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Estado" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="done">Listo</option>
            </Select>
            <Select label="Prioridad" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Asignado a" value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Facundo / Mauricio" />
            <Input label="Fecha límite" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} type="date" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={saveEdit} disabled={saving || !editForm.title}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
            <Button variant="secondary" onClick={() => deleteTask(editing!.id)} className="!text-red-400 hover:!bg-red-500/10">
              <Trash2 size={13} /> Eliminar
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
