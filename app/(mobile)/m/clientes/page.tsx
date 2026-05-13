'use client'

import { useEffect, useState } from 'react'
import { Search, Globe, Copy, Check, ChevronRight, X, Share2 } from 'lucide-react'

interface Client { id: string; name: string; email: string | null; industry: string | null; status: string }
interface Portal { token: string; pin: string; active: boolean }

export default function ClientesMobilePage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [openPortal, setOpenPortal] = useState<{ clientId: string; clientName: string; portal: Portal | null; loading: boolean } | null>(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false) })
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  async function showPortal(c: Client) {
    setOpenPortal({ clientId: c.id, clientName: c.name, portal: null, loading: true })
    const res = await fetch(`/api/clients/${c.id}/portal`)
    const { portal } = await res.json()
    setOpenPortal(p => p ? { ...p, portal: portal ?? null, loading: false } : null)
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400',
    inactive: 'bg-white/5 text-white/30',
    prospect: 'bg-blue-500/10 text-blue-400',
  }
  const STATUS_LABEL: Record<string, string> = { active: 'ACTIVO', inactive: 'INACTIVO', prospect: 'PROSPECTO' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="shrink-0 px-4 bg-[#07101f]"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 16px)`, paddingBottom: '12px' }}
      >
        <p className="mobile-title text-white font-bold text-lg mb-3">Clientes</p>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl">
          <Search size={14} className="text-white/25 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="flex-1 bg-transparent text-white placeholder-white/20 outline-none"
            style={{ fontSize: '16px' }}
          />
        </div>
      </header>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-white/30">No hay clientes</p>
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-[#f97316] shrink-0"
              style={{ background: 'rgba(249,115,22,0.1)' }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{c.name}</p>
              <p className="text-[11px] text-white/30 truncate mt-0.5">{c.email || c.industry || '—'}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] || 'bg-white/5 text-white/30'}`}>
              {STATUS_LABEL[c.status] || c.status}
            </span>
            <button
              onClick={() => showPortal(c)}
              className="p-2 rounded-xl text-white/25 hover:text-[#f97316] transition-colors shrink-0"
              style={{ background: 'rgba(249,115,22,0.06)' }}
            >
              <Globe size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Sheet portal */}
      {openPortal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setOpenPortal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full rounded-t-3xl p-6 space-y-5"
            style={{ background: '#0d1c30', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Portal del cliente</p>
                <p className="text-lg font-bold text-white">{openPortal.clientName}</p>
              </div>
              <button onClick={() => setOpenPortal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X size={15} />
              </button>
            </div>

            {openPortal.loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : openPortal.portal ? (
              <>
                {/* PIN */}
                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                  style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <div>
                    <p className="text-[10px] font-bold text-[#f97316]/60 uppercase tracking-widest mb-1">PIN de acceso</p>
                    <p className="text-3xl font-black text-white tracking-[0.2em] mobile-mono">{openPortal.portal.pin}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${openPortal.portal.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {openPortal.portal.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                {/* Link */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <a href={`/portal/${openPortal.portal.token}`} target="_blank" rel="noreferrer"
                    className="flex-1 text-[12px] text-[#f97316] truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/portal/{openPortal.portal.token.slice(0, 10)}…
                  </a>
                  <button onClick={() => copyLink(openPortal.portal!.token)}
                    className="shrink-0 text-white/30 hover:text-white transition-colors">
                    {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                </div>

                {/* Compartir link de instalación */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/portal/${openPortal.portal!.token}/instalar`
                    if (navigator.share) {
                      navigator.share({ title: `Portal ${openPortal.clientName}`, text: `Accedé a tu portal de Nova Agency`, url })
                    } else {
                      navigator.clipboard.writeText(url)
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
                  <Share2 size={15} /> Enviar link al cliente
                </button>

                {/* Abrir portal */}
                <a href={`/portal/${openPortal.portal.token}/inicio`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                  <Globe size={16} /> Abrir portal del cliente
                  <ChevronRight size={14} />
                </a>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-white/30 mb-4">Este cliente no tiene portal todavía.</p>
                <p className="text-xs text-white/20">Crealo desde el dashboard web.</p>
              </div>
            )}

            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}
    </div>
  )
}
