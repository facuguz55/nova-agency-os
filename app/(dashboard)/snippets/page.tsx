'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button, Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Copy, Check, Plus, Trash2, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Snippet {
  id: string; title: string; content: string; category: string; created_at: string
}

const CATS = ['Caption', 'Email', 'CTA', 'Propuesta', 'WhatsApp', 'Otros']
const CAT_COLOR: Record<string, string> = {
  Caption: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Email:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CTA:     'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
  Propuesta: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  WhatsApp: 'text-green-400 bg-green-400/10 border-green-400/20',
  Otros:   'text-[#64748b] bg-[#1a2d45] border-[#253f60]',
}
const EMPTY = { title: '', content: '', category: 'Caption' }

export default function SnippetsPage() {
  usePageTitle('Snippets')
  const supabase = createClient()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')
  const [copied, setCopied]     = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('snippets').select('*').order('created_at', { ascending: false })
    setSnippets(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await supabase.from('snippets').insert({ title: form.title.trim(), content: form.content.trim(), category: form.category })
    setSaving(false); setShowModal(false); setForm(EMPTY); load()
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar snippet?')) return
    await supabase.from('snippets').delete().eq('id', id)
    load()
  }

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter ? snippets.filter(s => s.category === filter) : snippets

  return (
    <>
      <Header
        title="Snippets"
        subtitle="Textos y copys reutilizables"
        actions={<Button onClick={() => setShowModal(true)} size="sm"><Plus size={13}/> Nuevo snippet</Button>}
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Filtro por categoría */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!filter ? 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]' : 'bg-[#0f1d30] border-[#1a2d45] text-[#64748b] hover:text-white'}`}>
            Todos ({snippets.length})
          </button>
          {CATS.map(c => {
            const count = snippets.filter(s => s.category === c).length
            if (count === 0) return null
            return (
              <button key={c} onClick={() => setFilter(filter === c ? '' : c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === c ? 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]' : 'bg-[#0f1d30] border-[#1a2d45] text-[#64748b] hover:text-white'}`}>
                {c} ({count})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag size={28} className="text-[#1a2d45]"/>
            <p className="text-sm text-[#475569]">Sin snippets todavía</p>
            <Button onClick={() => setShowModal(true)} size="sm">Crear el primero</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(s => (
              <div key={s.id} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex flex-col gap-3 group hover:border-[#253f60] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-snug">{s.title}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${CAT_COLOR[s.category] || CAT_COLOR.Otros}`}>{s.category}</span>
                </div>
                <p className="text-xs text-[#64748b] whitespace-pre-wrap line-clamp-4 flex-1">{s.content}</p>
                <div className="flex items-center justify-between pt-1 border-t border-[#1a2d45]">
                  <button onClick={() => copy(s.id, s.content)}
                    className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-white transition-colors">
                    {copied === s.id ? <><Check size={12} className="text-emerald-400"/> Copiado</> : <><Copy size={12}/> Copiar</>}
                  </button>
                  <button onClick={() => del(s.id)} className="text-[#334155] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY) }} title="Nuevo snippet">
        <div className="space-y-4">
          <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="CTA para Instagram Reels" />
          <Select label="Categoría" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Textarea label="Contenido *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Pegá acá el texto..." />
          <div className="flex gap-3 pt-1">
            <Button onClick={save} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving ? 'Guardando...' : 'Guardar snippet'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowModal(false); setForm(EMPTY) }}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
