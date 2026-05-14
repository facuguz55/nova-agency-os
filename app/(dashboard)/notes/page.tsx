'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { Plus, Search, FileText, Trash2, Edit2 } from 'lucide-react'

interface Note {
  id: string; title: string; content: string | null
  created_at: string; updated_at: string
  projects: { name: string } | null; clients: { name: string } | null
}
interface Client  { id: string; name: string }
interface Project { id: string; name: string }

export default function NotesPage() {
  usePageTitle('Notas')
  const [notes, setNotes]     = useState<Note[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [form, setForm]       = useState({ title: '', content: '', project_id: '', client_id: '' })
  const [saving, setSaving]   = useState(false)
  const [active, setActive]   = useState<Note | null>(null)

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    const [nRes, cRes, pRes] = await Promise.all([
      fetch(`/api/notes?${p}`), fetch('/api/clients'), fetch('/api/projects'),
    ])
    const [n, c, pr] = await Promise.all([nRes.json(), cRes.json(), pRes.json()])
    setNotes(n.notes || [])
    setClients(c.clients || [])
    setProjects(pr.projects || [])
    if (!active && (n.notes || []).length > 0) setActive((n.notes || [])[0])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function save() {
    setSaving(true)
    if (editing) {
      await fetch(`/api/notes/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, content: form.content }),
      })
    } else {
      await fetch('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: form.project_id || null, client_id: form.client_id || null }),
      })
    }
    setShowModal(false); setEditing(null)
    setForm({ title: '', content: '', project_id: '', client_id: '' })
    setSaving(false); load()
  }

  async function deleteNote(id: string) {
    if (!confirm('¿Eliminar nota?')) return
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (active?.id === id) setActive(null)
    load()
  }

  function openEdit(note: Note) {
    setEditing(note)
    setForm({ title: note.title, content: note.content || '', project_id: '', client_id: '' })
    setShowModal(true)
  }

  return (
    <>
      <Header
        title="Notas"
        subtitle={`${notes.length} nota${notes.length !== 1 ? 's' : ''}`}
        actions={<Button onClick={() => { setEditing(null); setForm({ title: '', content: '', project_id: '', client_id: '' }); setShowModal(true) }} size="sm"><Plus size={13}/> Nueva nota</Button>}
      />

      <div className="flex-1 flex overflow-hidden bg-grid">
        {/* Lista */}
        <div className="w-72 shrink-0 border-r border-[#1e2f4a] flex flex-col">
          <div className="p-3 border-b border-[#1e2f4a]">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-2 bg-[#080f1e] border border-[#1e2f4a] rounded-xl text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#ff8c42]/40"/>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8"><div className="w-4 h-4 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin"/></div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <FileText size={24} className="text-[#1e2f4a]"/>
                <p className="text-xs text-[#334155]">No hay notas</p>
              </div>
            ) : notes.map(note => (
              <div
                key={note.id}
                onClick={() => setActive(note)}
                className={`p-3 border-b border-[#1e2f4a]/50 cursor-pointer transition-colors group ${active?.id === note.id ? 'bg-[#ff8c42]/5 border-l-2 border-l-[#ff8c42]' : 'hover:bg-white/[.02]'}`}
              >
                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                <p className="text-xs text-[#334155] mt-0.5 truncate">{note.content?.slice(0, 60) || 'Sin contenido'}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#1e2f4a]">{formatRelative(note.updated_at)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={e => { e.stopPropagation(); openEdit(note) }} className="text-[#475569] hover:text-white"><Edit2 size={11}/></button>
                    <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }} className="text-[#475569] hover:text-red-400"><Trash2 size={11}/></button>
                  </div>
                </div>
                {(note.projects || note.clients) && (
                  <span className="text-[10px] text-[#ff8c42]/60">{note.projects?.name || note.clients?.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visor */}
        <div className="flex-1 overflow-y-auto p-6">
          {active ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{active.title}</h2>
                  <p className="text-xs text-[#334155] mt-1">
                    Actualizado {formatRelative(active.updated_at)}
                    {active.projects && <> · {active.projects.name}</>}
                    {active.clients && <> · {active.clients.name}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(active)}><Edit2 size={12}/> Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteNote(active.id)}><Trash2 size={12}/></Button>
                </div>
              </div>
              <div className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-wrap">
                {active.content || <span className="text-[#334155] italic">Sin contenido</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText size={40} className="text-[#1e2f4a]"/>
              <p className="text-sm text-[#334155]">Seleccioná una nota o creá una nueva</p>
              <Button size="sm" onClick={() => setShowModal(true)}><Plus size={12}/> Nueva nota</Button>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null) }} title={editing ? 'Editar nota' : 'Nueva nota'} size="lg">
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título de la nota" />
          {!editing && (
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
          )}
          <Textarea label="Contenido" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="Escribí acá..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear nota'}</Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
