'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Calendar, Flag, Trash2, Pencil, CheckSquare2, Square, MessageCircle, Send } from 'lucide-react'

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

const COLUMNS: { key: Task['status']; label: string; color: string; dot: string; accent: string }[] = [
  { key: 'todo',        label: 'Por hacer',   color: 'text-[var(--text-3)]',   dot: 'bg-[var(--text-4)]',    accent: 'rgba(255,255,255,0.06)' },
  { key: 'in_progress', label: 'En progreso', color: 'text-blue-400',           dot: 'bg-blue-400',            accent: 'rgba(59,130,246,0.12)'  },
  { key: 'review',      label: 'En revisión', color: 'text-[#f59e0b]',          dot: 'bg-[#f59e0b]',           accent: 'rgba(245,158,11,0.12)'  },
  { key: 'done',        label: 'Listo',       color: 'text-emerald-400',        dot: 'bg-emerald-400',         accent: 'rgba(16,185,129,0.1)'   },
]

const PRIORITY_COLOR: Record<string, string> = {
  low:    'text-[var(--text-4)]',
  medium: 'text-blue-400',
  high:   'text-[#f59e0b]',
  urgent: 'text-red-400',
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' }

const PRIORITY_BG: Record<string, string> = {
  low:    'bg-white/[.03] border-[rgba(255,255,255,0.06)]',
  medium: 'bg-blue-500/[.04] border-blue-500/[.12]',
  high:   'bg-[rgba(245,158,11,0.04)] border-[rgba(245,158,11,0.15)]',
  urgent: 'bg-red-500/[.05] border-red-500/[.15]',
}

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', project_id: '', client_id: '', due_date: '' }

type EditForm = {
  title: string; description: string; status: string; priority: string
  assigned_to: string; project_id: string; client_id: string; due_date: string
}
interface ChecklistItem { id: string; text: string; done: boolean }
interface Comment { id: string; author: string; content: string; created_at: string }

export default function TasksPage() {
  usePageTitle('Tareas')
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
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newCheck, setNewCheck]   = useState('')
  const [comments, setComments]   = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Drag state
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState<Task['status'] | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

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
    setChecklist([])
    setComments([])
    setNewCheck('')
    setNewComment('')
    setEditing(task)
    fetch(`/api/tasks/${task.id}`).then(r => r.json()).then(d => {
      if (d.task?.checklist) setChecklist(d.task.checklist)
    }).catch(() => {})
    fetch(`/api/tasks/${task.id}/comments`).then(r => r.json()).then(d => {
      setComments(d.comments || [])
    }).catch(() => {})
  }

  async function addCheckItem() {
    if (!newCheck.trim() || !editing) return
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newCheck.trim(), done: false }
    const updated = [...checklist, item]
    setChecklist(updated)
    setNewCheck('')
    await fetch(`/api/tasks/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checklist: updated }) })
  }

  async function toggleCheck(itemId: string) {
    if (!editing) return
    const updated = checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c)
    setChecklist(updated)
    await fetch(`/api/tasks/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checklist: updated }) })
  }

  async function removeCheck(itemId: string) {
    if (!editing) return
    const updated = checklist.filter(c => c.id !== itemId)
    setChecklist(updated)
    await fetch(`/api/tasks/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checklist: updated }) })
  }

  async function sendComment() {
    if (!newComment.trim() || !editing) return
    setSendingComment(true)
    const res = await fetch(`/api/tasks/${editing.id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim(), author: 'Equipo' }),
    })
    const { comment } = await res.json()
    if (comment) setComments(c => [...c, comment])
    setNewComment('')
    setSendingComment(false)
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
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setTasks(t => t.map(task => task.id === id ? { ...task, status: newStatus } : task))
  }

  async function deleteTask(id: string) {
    if (!confirm('¿Eliminar tarea?')) return
    if (editing?.id === id) setEditing(null)
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    load()
  }

  function onDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(taskId)
    // Offset para un feedback más natural
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onDragEnd() {
    setDraggingId(null)
    setDragOver(null)
  }

  function onDrop(e: React.DragEvent, status: Task['status']) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) moveTask(taskId, status)
    setDragOver(null)
    setDraggingId(null)
  }

  function onDragOver(e: React.DragEvent, status: Task['status']) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(status)
  }

  function onDragLeave(e: React.DragEvent) {
    // Solo limpiar si el mouse sale del contenedor real
    const related = e.relatedTarget as HTMLElement | null
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      setDragOver(null)
    }
  }

  const byStatus = (status: Task['status']) => tasks.filter(t => t.status === status)
  const dueSoon  = useMemo(
    () => tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= new Date(Date.now() + 3 * 86400000)),
    [tasks],
  )

  return (
    <>
      <Header
        title="Tareas"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} pendientes`}
        actions={
          <div className="flex gap-2">
            {/* Toggle vista */}
            <div className="flex bg-white/[.04] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
              {(['kanban','list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-3 py-1.5 text-[12px] capitalize transition-all',
                    view === v
                      ? 'bg-[rgba(245,158,11,0.12)] text-[var(--amber)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
                  )}
                >
                  {v === 'kanban' ? 'Kanban' : 'Lista'}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus size={13}/> Nueva tarea
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Alerta vencimiento próximo */}
        {dueSoon.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-xl text-[13px] text-[var(--amber)] flex items-center gap-2 animate-fade-up">
            <Flag size={13}/>
            {dueSoon.length} tarea{dueSoon.length > 1 ? 's' : ''} vence{dueSoon.length === 1 ? '' : 'n'} pronto: <span className="opacity-70">{dueSoon.map(t => t.title).join(', ')}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : view === 'kanban' ? (
          <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
            {COLUMNS.map((col, colIdx) => (
              <div
                key={col.key}
                className="flex flex-col gap-3 animate-fade-up"
                style={{ animationDelay: `${colIdx * 0.07}s` }}
                onDragOver={e => onDragOver(e, col.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full', col.dot)} />
                    <h3 className={cn('text-[11px] font-semibold uppercase tracking-[0.1em]', col.color)}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[10px] text-[var(--text-4)] bg-white/[.04] border border-[rgba(255,255,255,0.07)] rounded-full px-2 py-0.5">
                    {byStatus(col.key).length}
                  </span>
                </div>

                {/* Drop zone */}
                <div className={cn(
                  'kanban-drop-zone flex flex-col gap-2 min-h-[200px] rounded-xl p-1.5 border border-dashed transition-all duration-200',
                  dragOver === col.key
                    ? 'drag-over border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.03)]'
                    : 'border-[rgba(255,255,255,0.04)]',
                )}>
                  {byStatus(col.key).map((task, taskIdx) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => onDragStart(e, task.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => openEdit(task)}
                      className={cn(
                        'kanban-card group relative border rounded-xl p-3.5 cursor-grab active:cursor-grabbing select-none',
                        'bg-[#111] animate-fade-up',
                        PRIORITY_BG[task.priority],
                        draggingId === task.id && 'dragging opacity-50',
                      )}
                      style={{ animationDelay: `${colIdx * 0.07 + taskIdx * 0.04}s` }}
                    >
                      {/* Priority left bar */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                        style={{ background: PRIORITY_COLOR[task.priority].replace('text-', '').includes('[') ? 'var(--amber)' : undefined }}
                      />

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13px] font-medium text-white leading-snug flex-1">{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(task) }}
                            className="text-[var(--text-4)] hover:text-[var(--amber)] transition-colors"
                          >
                            <Pencil size={11}/>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                            className="text-[var(--text-4)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-[var(--text-3)] mb-2 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wide', PRIORITY_COLOR[task.priority])}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                        {task.due_date && (
                          <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1">
                            <Calendar size={9}/>{formatDate(task.due_date).split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {(task.projects || task.clients) && (
                        <p className="text-[10px] text-[var(--text-4)] mt-1.5 truncate">
                          {task.projects?.name || task.clients?.name}
                        </p>
                      )}

                      {task.assigned_to && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-4 h-4 rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-[var(--amber)]">{task.assigned_to.slice(0,1).toUpperCase()}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-3)]">{task.assigned_to}</span>
                        </div>
                      )}

                      {/* Quick move buttons */}
                      <div className="flex flex-wrap gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={e => e.stopPropagation()}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button
                            key={c.key}
                            onClick={() => moveTask(task.id, c.key)}
                            className={cn(
                              'text-[9px] px-1.5 py-0.5 rounded-md border transition-all hover:scale-105',
                              c.color, 'border-current/20 hover:bg-white/[.04]',
                            )}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {byStatus(col.key).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                      <div className="w-6 h-6 rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        <Plus size={10} className="text-[var(--text-4)]" />
                      </div>
                      <p className="text-[10px] text-[var(--text-4)]">Vacío</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vista lista */
          <div className="panel overflow-hidden animate-fade-up">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tarea', 'Estado', 'Prioridad', 'Asignado', 'Vence', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] text-[var(--text-4)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[.02] transition-colors last:border-0 cursor-pointer animate-fade-up"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium text-white">{t.title}</p>
                      {(t.projects || t.clients) && <p className="text-[11px] text-[var(--text-4)]">{t.projects?.name || t.clients?.name}</p>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={t.status}/></td>
                    <td className="px-5 py-3">
                      <span className={cn('text-[11px] font-semibold uppercase', PRIORITY_COLOR[t.priority])}>{PRIORITY_LABEL[t.priority]}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-3)]">{t.assigned_to || '—'}</td>
                    <td className="px-5 py-3 text-[12px] text-[var(--text-3)]">{t.due_date ? formatDate(t.due_date).split(' ')[0] : '—'}</td>
                    <td className="px-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteTask(t.id)} className="text-[var(--text-4)] hover:text-red-400 transition-colors">
                        <Trash2 size={13}/>
                      </button>
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
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tarea" size="lg">
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

          {/* Checklist */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
            <p className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
              <CheckSquare2 size={12} /> Checklist {checklist.length > 0 && `(${checklist.filter(c=>c.done).length}/${checklist.length})`}
            </p>
            <div className="space-y-1.5 mb-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleCheck(item.id)} className="shrink-0">
                    {item.done
                      ? <CheckSquare2 size={14} className="text-[var(--amber)]" />
                      : <Square size={14} className="text-[var(--text-4)]" />}
                  </button>
                  <span className={cn('flex-1 text-[13px]', item.done ? 'line-through text-[var(--text-4)]' : 'text-[var(--text-2)]')}>{item.text}</span>
                  <button onClick={() => removeCheck(item.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-4)] hover:text-red-400 transition-all">
                    <Trash2 size={10}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCheck}
                onChange={e => setNewCheck(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCheckItem() }}
                placeholder="Agregar ítem..."
                className="flex-1 px-3 py-1.5 text-[12px] bg-white/[.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-[var(--text)] placeholder-[var(--text-4)] focus:outline-none focus:border-[rgba(245,158,11,0.35)] transition-all"
              />
              <Button size="sm" variant="secondary" onClick={addCheckItem} disabled={!newCheck.trim()}>+</Button>
            </div>
          </div>

          {/* Comentarios */}
          <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
            <p className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
              <MessageCircle size={12} /> Comentarios {comments.length > 0 && `(${comments.length})`}
            </p>
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="bg-white/[.03] rounded-xl px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-[var(--amber)]">{c.author}</span>
                    <span className="text-[10px] text-[var(--text-4)]">{new Date(c.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[12px] text-[var(--text-2)]">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-[12px] text-[var(--text-4)]">Sin comentarios todavía</p>}
            </div>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendComment() }}
                placeholder="Escribir comentario..."
                className="flex-1 px-3 py-1.5 text-[12px] bg-white/[.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-[var(--text)] placeholder-[var(--text-4)] focus:outline-none focus:border-[rgba(245,158,11,0.35)] transition-all"
              />
              <Button size="sm" variant="secondary" onClick={sendComment} disabled={!newComment.trim() || sendingComment}>
                <Send size={11}/>
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={saveEdit} disabled={saving || !editForm.title}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
            <Button variant="danger" onClick={() => deleteTask(editing!.id)}>
              <Trash2 size={13} /> Eliminar
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
