'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Input'
import { TrendingUp, Sparkles, Copy, Check, ChevronDown } from 'lucide-react'

interface Client { id: string; name: string; industry: string | null; status: string }

function parseMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-lg font-bold text-white mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h2 class="text-xl font-bold text-white mt-6 mb-2">$1</h2>')
    .replace(/^- (.+)$/gm,   '<li class="ml-4 text-[#94a3b8] list-disc">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, '<ul class="space-y-1 my-2">$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-[#94a3b8] list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-[#94a3b8] leading-relaxed mb-3">')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p class="text-[#94a3b8] leading-relaxed mb-3">$1</p>')
    .replace(/<p[^>]*><\/p>/g, '')
}

export default function ReportsPage() {
  const [clients, setClients]     = useState<Client[]>([])
  const [selected, setSelected]   = useState<Client | null>(null)
  const [report, setReport]       = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [open, setOpen]           = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
  }, [])

  async function generate() {
    if (!selected) return
    setGenerating(true)
    setReport('')
    setError('')
    try {
      const res  = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selected.id }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setReport(data.report || '')
    } catch {
      setError('Error de conexión.')
    }
    setGenerating(false)
  }

  function copy() {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeClients   = clients.filter(c => c.status === 'active')
  const inactiveClients = clients.filter(c => c.status !== 'active')

  return (
    <>
      <Header
        title="Reportes IA"
        subtitle="Generá reportes ejecutivos por cliente"
      />

      <div className="flex-1 overflow-y-auto p-6 bg-grid">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Selector de cliente */}
          <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-[#ff8c42]" />
              <h3 className="text-sm font-semibold text-white">Generar reporte</h3>
            </div>

            {/* Dropdown personalizado */}
            <div className="relative">
              <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#080f1e] border border-[#1e2f4a] rounded-xl text-sm text-left focus:outline-none hover:border-[#ff8c42]/30 transition-colors"
              >
                {selected ? (
                  <span className="text-white">{selected.name}
                    <span className="ml-2 text-[10px] text-[#475569]">{selected.industry || ''}</span>
                  </span>
                ) : (
                  <span className="text-[#334155]">Seleccioná un cliente...</span>
                )}
                <ChevronDown size={14} className={`text-[#475569] transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute z-20 mt-1 w-full bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl shadow-xl overflow-hidden">
                  {clients.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[#334155]">No hay clientes</p>
                  ) : (
                    <>
                      {activeClients.length > 0 && (
                        <>
                          <p className="px-4 pt-3 pb-1 text-[9px] text-[#1e3a5f] uppercase tracking-widest font-semibold">Activos</p>
                          {activeClients.map(c => (
                            <button key={c.id} onClick={() => { setSelected(c); setOpen(false); setReport('') }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[.03] transition-colors flex items-center justify-between group ${selected?.id === c.id ? 'text-[#ff8c42]' : 'text-[#94a3b8]'}`}>
                              <span>{c.name}</span>
                              {c.industry && <span className="text-[10px] text-[#334155] group-hover:text-[#475569]">{c.industry}</span>}
                            </button>
                          ))}
                        </>
                      )}
                      {inactiveClients.length > 0 && (
                        <>
                          <p className="px-4 pt-3 pb-1 text-[9px] text-[#1e3a5f] uppercase tracking-widest font-semibold">Otros</p>
                          {inactiveClients.map(c => (
                            <button key={c.id} onClick={() => { setSelected(c); setOpen(false); setReport('') }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[.03] transition-colors ${selected?.id === c.id ? 'text-[#ff8c42]' : 'text-[#475569]'}`}>
                              {c.name}
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={generate}
              disabled={!selected || generating}
              size="sm"
            >
              {generating
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                : <><Sparkles size={13} /> Generar reporte</>
              }
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Skeleton mientras genera */}
          {generating && (
            <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-[#1e2f4a] rounded-lg w-2/3" />
              <div className="h-3 bg-[#1e2f4a] rounded-lg w-full" />
              <div className="h-3 bg-[#1e2f4a] rounded-lg w-5/6" />
              <div className="h-3 bg-[#1e2f4a] rounded-lg w-4/5" />
              <div className="mt-4 h-4 bg-[#1e2f4a] rounded-lg w-1/2" />
              <div className="h-3 bg-[#1e2f4a] rounded-lg w-full" />
              <div className="h-3 bg-[#1e2f4a] rounded-lg w-3/4" />
            </div>
          )}

          {/* Reporte generado */}
          {report && !generating && (
            <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2f4a]">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-[#ff8c42]" />
                  <span className="text-xs font-semibold text-white">Reporte — {selected?.name}</span>
                </div>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[.04]"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div
                className="px-6 py-5 text-sm"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }}
              />
            </div>
          )}

          {/* Empty state */}
          {!report && !generating && !error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
                <TrendingUp size={20} className="text-[#1e2f4a]" />
              </div>
              <p className="text-sm text-[#334155]">Seleccioná un cliente y generá su reporte</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
