'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Rocket, AlertTriangle, FileText, Check, RefreshCw, Trash2 } from 'lucide-react'

interface Message {
  id: string
  type: 'new_service' | 'problem' | 'note'
  title: string | null
  body: string
  status: string
  project_id: string | null
  created_at: string
  clients: { name: string } | { name: string }[] | null
  projects?: { name: string } | { name: string }[] | null
}

const TYPE_CONFIG = {
  new_service: { label: 'Nuevo servicio', icon: Rocket,       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  problem:     { label: 'Problema',       icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  note:        { label: 'Nota',           icon: FileText,      color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
}

export default function SolicitudesPage() {
  usePageTitle('Solicitudes')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/portal-messages')
    const data = await res.json()
    setMessages(data.messages || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markResolved(id: string) {
    await fetch(`/api/portal-messages/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    load()
  }

  async function deleteMessage(id: string) {
    if (!confirm('¿Eliminar esta solicitud? No se puede deshacer.')) return
    await fetch(`/api/portal-messages/${id}`, { method: 'DELETE' })
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const filtered = messages.filter(m => !filter || m.type === filter)
  const pending  = messages.filter(m => m.status === 'pending').length

  function clientName(m: Message) {
    if (!m.clients) return '—'
    return Array.isArray(m.clients) ? m.clients[0]?.name : m.clients.name
  }
  function projectName(m: Message) {
    if (!m.projects) return null
    return Array.isArray(m.projects) ? m.projects[0]?.name : m.projects.name
  }

  return (
    <>
      <Header
        title="Solicitudes"
        subtitle="Mensajes desde el portal de clientes"
        actions={
          <button onClick={load} className="p-2 rounded-xl text-[var(--text-3)] hover:text-white transition-colors">
            <RefreshCw size={15} />
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-grid">

        {/* Stats rápidas */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',            value: messages.length,                                        color: 'text-white' },
            { label: 'Pendientes',       value: pending,                                                color: 'text-[var(--amber)]' },
            { label: 'Nuevos servicios', value: messages.filter(m => m.type === 'new_service').length,  color: 'text-orange-400' },
            { label: 'Problemas',        value: messages.filter(m => m.type === 'problem').length,      color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-[var(--text-3)] mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {[
            { value: '',            label: 'Todos' },
            { value: 'new_service', label: 'Servicios' },
            { value: 'problem',     label: 'Problemas' },
            { value: 'note',        label: 'Notas' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={filter === f.value
                ? { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' }
                : { background: 'var(--surface-0)', color: 'var(--text-3)', border: '1px solid var(--border)' }
              }>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <MessageSquare size={32} className="text-[var(--text-4)]" />
            <p className="text-sm text-[var(--text-3)]">No hay mensajes todavía</p>
            <p className="text-xs text-[var(--text-4)]">Los clientes pueden enviar solicitudes desde su portal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const cfg  = TYPE_CONFIG[m.type] || TYPE_CONFIG.note
              const Icon = cfg.icon
              const done = m.status === 'resolved'
              return (
                <div key={m.id} className="rounded-2xl p-5 transition-all"
                  style={{
                    background: done ? 'rgba(255,255,255,0.01)' : 'var(--surface-0)',
                    border: done ? '1px solid var(--border)' : `1px solid ${cfg.border}`,
                    opacity: done ? 0.5 : 1,
                  }}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-white/80 font-semibold text-sm">{clientName(m)}</span>
                        {projectName(m) && (
                          <span className="text-[11px] text-[var(--text-3)]">· {projectName(m)}</span>
                        )}
                        <span className="text-[11px] text-[var(--text-4)] ml-auto shrink-0">{formatDate(m.created_at)}</span>
                      </div>
                      {m.title && (
                        <p className="text-sm font-semibold text-white mb-1">{m.title}</p>
                      )}
                      <p className="text-sm text-[var(--text-3)] leading-relaxed">{m.body}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    {!done && (
                      <button onClick={() => markResolved(m.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <Check size={12} /> Marcar resuelto
                      </button>
                    )}
                    <button onClick={() => deleteMessage(m.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
