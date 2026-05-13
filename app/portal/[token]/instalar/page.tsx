'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

interface PortalInfo {
  client: { name: string; industry: string | null }
  pin: string
}

export default function PortalInstalarPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo]       = useState<PortalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'ios' | 'android'>('ios')
  const [copied, setCopied]   = useState(false)
  const [origin, setOrigin]   = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch(`/api/portal/${token}/info`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setInfo(d) })
      .finally(() => setLoading(false))
  }, [token])

  const portalUrl = `${origin}/portal/${token}/inicio`

  function copyLink() {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!info) return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center">
      <p className="text-white/30 text-sm">Link inválido</p>
    </div>
  )

  const IOS_STEPS = [
    { icon: '1', text: 'Abrí este link en Safari (no en Chrome)' },
    { icon: '2', text: 'Tocá el botón compartir ↑ en la barra inferior' },
    { icon: '3', text: 'Deslizá y tocá "Añadir a pantalla de inicio"' },
    { icon: '4', text: 'Confirmá tocando "Añadir" arriba a la derecha' },
  ]
  const ANDROID_STEPS = [
    { icon: '1', text: 'Abrí este link en Chrome' },
    { icon: '2', text: 'Tocá los 3 puntos ⋮ en la esquina superior derecha' },
    { icon: '3', text: 'Tocá "Agregar a pantalla de inicio"' },
    { icon: '4', text: 'Confirmá tocando "Agregar"' },
  ]
  const steps = tab === 'ios' ? IOS_STEPS : ANDROID_STEPS

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .inst-title { font-family: 'Syne', sans-serif; }
        .inst-body  { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="inst-body min-h-screen bg-[#050c1a] text-white"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0px)' }}>

        {/* Orbs de fondo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-md mx-auto px-5 py-10 space-y-7">

          {/* Logo + agencia */}
          <div className="flex items-center gap-3">
            <Image src="/logo-nova-dark.png" alt="Nova Agency" width={36} height={36} className="object-contain rounded-xl" />
            <div>
              <p className="inst-title text-[11px] font-bold text-white/30 uppercase tracking-[.2em]">Nova Agency</p>
            </div>
          </div>

          {/* Hero */}
          <div>
            <p className="text-[#f97316] text-[11px] font-bold uppercase tracking-[.2em] mb-2">Tu portal personal</p>
            <h1 className="inst-title text-3xl font-bold text-white leading-tight">
              Hola,<br />{info.client.name}
            </h1>
            {info.client.industry && (
              <p className="text-white/30 text-sm mt-1">{info.client.industry}</p>
            )}
          </div>

          {/* PIN */}
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div>
              <p className="text-[10px] font-bold text-[#f97316]/60 uppercase tracking-[.2em] mb-1">Tu PIN de acceso</p>
              <p className="inst-title text-4xl font-black text-white tracking-[.25em]">{info.pin}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(249,115,22,0.1)' }}>
              🔑
            </div>
          </div>

          {/* QR */}
          <div className="rounded-2xl p-5 flex flex-col items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[.2em]">Escaneá para abrir</p>
            <div className="p-4 rounded-2xl bg-white">
              <QRCodeSVG
                value={portalUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#050c1a"
                level="M"
              />
            </div>
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="flex-1 text-[11px] text-white/40 truncate">{portalUrl}</p>
              <button onClick={copyLink}
                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                style={copied
                  ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                  : { background: 'rgba(249,115,22,0.1)', color: '#f97316' }
                }>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Instrucciones de instalación */}
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-[.2em] mb-3">
                Instalá la app en tu celu
              </p>
              {/* Tabs */}
              <div className="flex gap-2 p-1 rounded-xl mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['ios', 'android'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-2 rounded-lg text-[12px] font-bold transition-all"
                    style={tab === t
                      ? { background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }
                      : { color: 'rgba(255,255,255,0.25)' }
                    }>
                    {t === 'ios' ? ' iPhone' : ' Android'}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 px-4 py-3.5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="inst-title w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                      {s.icon}
                    </span>
                    <p className="text-sm text-white/70 leading-snug">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA principal */}
          <a href={portalUrl}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl inst-title text-base font-bold text-white transition-all active:scale-[.98]"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 8px 32px rgba(249,115,22,0.35)' }}>
            Abrir mi portal →
          </a>

          <p className="text-center text-[11px] text-white/15 pb-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
            Nova Agency · Portal privado del cliente
          </p>

        </div>
      </div>
    </>
  )
}
