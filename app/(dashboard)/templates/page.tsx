'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { Plus, Copy, Sparkles, Trash2, Mail } from 'lucide-react'

interface Template {
  id: string; name: string; subject: string; body: string; type: string; created_at: string
}
interface Client { id: string; name: string; email: string | null; industry: string | null; notes: string | null }

const TYPES = ['general', 'onboarding', 'seguimiento', 'propuesta', 'reporte', 'cobranza']
const DEFAULT_TEMPLATES = [
  { name: 'Onboarding cliente', type: 'onboarding', subject: 'Bienvenido a Nova Agency — próximos pasos', body: 'Hola [Nombre],\n\nNos alegra tenerte como cliente de Nova Agency.\n\nEstos son los próximos pasos:\n1. Reunión de kick-off esta semana\n2. Acceso a herramientas compartidas\n3. Primer reporte en 30 días\n\nCualquier duda, respondé este email.\n\nSaludos,\nNova Agency' },
  { name: 'Seguimiento propuesta', type: 'seguimiento', subject: 'Seguimiento — propuesta Nova Agency', body: 'Hola [Nombre],\n\nQuería hacer un seguimiento de la propuesta que te enviamos.\n\n¿Tuviste oportunidad de revisarla? ¿Hay algo que quieras ajustar o aclarar?\n\nEstamos disponibles para una llamada cuando quieras.\n\nSaludos,\nNova Agency' },
  { name: 'Reporte mensual', type: 'reporte', subject: 'Reporte mensual — [Mes] [Año]', body: 'Hola [Nombre],\n\nTe compartimos el reporte de resultados del mes:\n\n[INSERTAR REPORTE]\n\nEl próximo mes seguimos trabajando en [objetivos].\n\nSaludos,\nNova Agency' },
]

export default function TemplatesPage() {
  usePageTitle('Templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected]   = useState<Template | null>(null)
  const [form, setForm]           = useState({ name: '', subject: '', body: '', type: 'general' })
  const [saving, setSaving]       = useState(false)
  const [showPersonalize, setShowPersonalize] = useState(false)
  const [personClient, setPersonClient]       = useState('')
  const [personalizing, setPersonalizing]     = useState(false)
  const [personalized, setPersonalized]       = useState('')

  async function load() {
    setLoading(true)
    const [tRes, cRes] = await Promise.all([fetch('/api/templates'), fetch('/api/clients')])
    const [t, c] = await Promise.all([tRes.json(), cRes.json()])
    setTemplates(t.templates || [])
    setClients(c.clients || [])
    if (!selected && (t.templates || []).length > 0) setSelected((t.templates || [])[0])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false); setForm({ name: '', subject: '', body: '', type: 'general' }); setSaving(false); load()
  }

  async function deleteTemplate(id: string) {
    if (!confirm('¿Eliminar template?')) return
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    setSelected(null); load()
  }

  async function seedDefaults() {
    for (const t of DEFAULT_TEMPLATES) {
      await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
    }
    load()
  }

  async function personalize() {
    if (!selected || !personClient) return
    setPersonalizing(true)
    const client = clients.find(c => c.id === personClient)
    const context = `Cliente: ${client?.name}\nEmail: ${client?.email || 'N/A'}\nIndustria: ${client?.industry || 'N/A'}\nNotas: ${client?.notes || 'Sin notas'}`
    const res = await fetch('/api/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalize: true, client_context: context, template_body: selected.body }),
    })
    const { personalized: text } = await res.json()
    setPersonalized(text || '')
    setPersonalizing(false)
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <>
      <Header
        title="Templates de email"
        subtitle={`${templates.length} template${templates.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button variant="secondary" onClick={seedDefaults} size="sm">Cargar ejemplos</Button>
            )}
            <Button onClick={() => setShowModal(true)} size="sm"><Plus size={13}/> Nuevo template</Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden bg-grid">
        {/* Lista */}
        <div className="w-64 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] text-[var(--text-4)] uppercase tracking-widest">Templates</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Mail size={24} className="text-[var(--text-4)]"/>
                <p className="text-xs text-[var(--text-4)] text-center px-4">Sin templates. Creá uno o cargá ejemplos.</p>
              </div>
            ) : templates.map(t => (
              <div key={t.id} onClick={() => { setSelected(t); setPersonalized('') }}
                className={`p-3 cursor-pointer transition-colors ${selected?.id === t.id ? 'bg-[var(--amber)]/5 border-l-2 border-l-[var(--amber)]' : 'hover:bg-white/[.02]'}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-sm font-medium text-white truncate">{t.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded-md">{t.type}</span>
                  <span className="text-[10px] text-[var(--text-4)]">{formatRelative(t.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visor */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <p className="text-sm text-[var(--text-3)] mt-0.5">Asunto: {selected.subject}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copy(selected.body)}><Copy size={12}/> Copiar</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setShowPersonalize(true); setPersonalized('') }}>
                    <Sparkles size={12}/> Personalizar con IA
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteTemplate(selected.id)}><Trash2 size={12}/></Button>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <pre className="text-sm text-[var(--text-2)] whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
              </div>

              {/* Resultado personalizado */}
              {personalized && (
                <div className="rounded-xl p-5" style={{ background: 'var(--surface-0)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#a855f7] flex items-center gap-1.5"><Sparkles size={12}/> Personalizado por IA</p>
                    <Button size="sm" variant="ghost" onClick={() => copy(personalized)}><Copy size={11}/> Copiar</Button>
                  </div>
                  <pre className="text-sm text-[var(--text-2)] whitespace-pre-wrap font-sans leading-relaxed">{personalized}</pre>
                </div>
              )}

              {showPersonalize && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium text-white">Personalizar para cliente</p>
                  <Select label="Cliente" value={personClient} onChange={e => setPersonClient(e.target.value)}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={personalize} disabled={personalizing || !personClient} size="sm">
                      {personalizing ? 'Personalizando...' : <><Sparkles size={12}/> Personalizar</>}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowPersonalize(false)} size="sm">Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Mail size={40} className="text-[var(--text-4)]"/>
              <p className="text-sm text-[var(--text-4)]">Seleccioná un template</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo template" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Onboarding cliente" />
            <Select label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input label="Asunto *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Bienvenido a Nova Agency" />
          <Textarea label="Cuerpo *" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={10} placeholder="Hola [Nombre],&#10;&#10;..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name || !form.subject || !form.body}>{saving ? 'Guardando...' : 'Crear template'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
