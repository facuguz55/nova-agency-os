'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { Plus, Search, FileText, Trash2, Edit2, Sparkles } from 'lucide-react'

interface Note {
  id: string; title: string; content: string | null
  created_at: string; updated_at: string
  projects: { name: string } | null; clients: { name: string } | null
}
interface Client  { id: string; name: string }
interface Project { id: string; name: string }

export default function NotesPage() {
  usePageTitle('Notas')
  const [notes, setNotes]         = useState<Note[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Note | null>(null)
  const [form, setForm]           = useState({ title: '', content: '', project_id: '', client_id: '' })
  const [saving, setSaving]       = useState(false)
  const [active, setActive]       = useState<Note | null>(null)
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI]       = useState(false)

  async function generateAINote() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Generá una nota estructurada sobre: ${aiPrompt}. Incluí puntos clave, acciones y contexto relevante.` }),
      })
      const { response } = await res.json()
      setForm(f => ({ ...f, title: aiPrompt.slice(0, 60), content: response }))
      setAiPrompt(''); setShowAI(false); setEditing(null); setShowModal(true)
    } catch { /* ignore */ }
    setAiLoading(false)
  }

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    const [nRes, cRes, pRes] = await Promise.all([
      fetch(`/api/notes?${p}`), fetch('/api/clients'), fetch('/api/projects'),
    ])
    const [n, c, pr] = await Promise.all([nRes.json(), cRes.json(), pRes.json()])
    setNotes(n.notes || []); setClients(c.clients || []); setProjects(pr.projects || [])
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
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAI(a => !a)}>
              <Sparkles size={13}/> Nota con IA
            </Button>
            <Button onClick={() => { setEditing(null); setForm({ title: '', content: '', project_id: '', client_id: '' }); setShowModal(true) }} size="sm">
              <Plus size={13}/> Nueva nota
            </Button>
          </div>
        }
      />

      {showAI && (
        <div className="shrink-0 mx-6 mb-0 mt-3 p-4 flex items-center gap-3 rounded-2xl"
          style={{ background: 'var(--surface-0)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Sparkles size={16} className="text-[var(--amber)] shrink-0" />
          <input autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') generateAINote(); if (e.key === 'Escape') setShowAI(false) }}
            placeholder="¿Sobre qué querés que Nova genere la nota?"
            className="flex-1 bg-transparent text-sm text-white placeholder-[var(--text-4)] outline-none" />
          <Button size="sm" onClick={generateAINote} disabled={aiLoading || !aiPrompt.trim()}>
            {aiLoading ? 'Generando...' : 'Generar'}
          </Button>
          <button onClick={() => setShowAI(false)} className="text-[var(--text-4)] hover:text-white text-xs">✕</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden bg-grid">
        {/* Lista */}
        <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white placeholder-[var(--text-4)] focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <FileText size={24} className="text-[var(--text-4)]"/>
                <p className="text-xs text-[var(--text-4)]">No hay notas</p>
              </div>
            ) : notes.map(note => (
              <div key={note.id} onClick={() => setActive(note)}
                className={`p-3 cursor-pointer transition-colors group ${active?.id === note.id ? 'bg-[var(--amber)]/5 border-l-2 border-l-[var(--amber)]' : 'hover:bg-white/[.02]'}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                <p className="text-xs text-[var(--text-4)] mt-0.5 truncate">{note.content?.slice(0, 60) || 'Sin contenido'}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[var(--text-4)]">{formatRelative(note.updated_at)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={e => { e.stopPropagation(); openEdit(note) }} className="text-[var(--text-3)] hover:text-white"><Edit2 size={11}/></button>
                    <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }} className="text-[var(--text-3)] hover:text-red-400"><Trash2 size={11}/></button>
                  </div>
                </div>
                {(note.projects || note.clients) && (
                  <span className="text-[10px] text-[var(--amber)]/60">{note.projects?.name || note.clients?.name}</span>
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
                  <p className="text-xs text-[var(--text-4)] mt-1">
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
              <div className="text-[var(--text-2)] text-sm leading-relaxed whitespace-pre-wrap">
                {active.content || <span className="text-[var(--text-4)] italic">Sin contenido</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText size={40} className="text-[var(--text-4)]"/>
              <p className="text-sm text-[var(--text-4)]">Seleccioná una nota o creá una nueva</p>
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
