'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PortalPinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake]   = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Backspace') { setPin(p => p.slice(0, -1)); return }
      if (/^[0-9]$/.test(e.key)) { setPin(p => p.length < 4 ? p + e.key : p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (pin.length === 4) verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  async function verify() {
    if (pin.length !== 4) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/portal/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const json = await res.json()
    if (json.ok) {
      localStorage.setItem(`portal_pin_${token}`, pin)
      router.push(`/portal/${token}/inicio`)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setError('PIN incorrecto')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-fade-up { animation: fadeUp .6s ease both; }
        .animate-fade-up-2 { animation: fadeUp .6s .15s ease both; }
        .animate-fade-up-3 { animation: fadeUp .6s .3s ease both; }
        .animate-shake { animation: shake .4s ease; }
        .pin-input {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .portal-bg {
          background: #050c1a;
          position: relative;
          overflow: hidden;
        }
        .portal-bg::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: radial-gradient(ellipse at 30% 40%, rgba(249,115,22,0.12) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.06) 0%, transparent 40%);
          animation: aurora 12s ease infinite;
          background-size: 200% 200%;
        }
        .glass-card {
          background: rgba(13, 27, 46, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .pin-dot-filled {
          background: #f97316;
          box-shadow: 0 0 20px rgba(249,115,22,0.5), 0 0 40px rgba(249,115,22,0.2);
          border-color: #f97316;
        }
        .key-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all .15s ease;
        }
        .key-btn:active { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); transform: scale(.94); }
        .key-btn:hover { background: rgba(255,255,255,0.08); }
      `}</style>

      <div className="portal-bg min-h-screen flex items-center justify-center p-5 pin-input">
        <div className="w-full max-w-[340px] relative z-10">

          {/* Logo */}
          <div className="flex justify-center mb-10 animate-fade-up">
            <Image src="/logo-nova-dark.png" alt="Nova Agency" width={80} height={80} className="object-contain rounded-2xl" />
          </div>

          {/* Card */}
          <div className={`glass-card rounded-3xl p-8 ${shake ? 'animate-shake' : ''} animate-fade-up-2`}>
            <p className="text-center text-white/90 font-semibold text-base mb-1" style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 20 }}>
              Portal del cliente
            </p>
            <p className="text-center text-[11px] text-white/30 mb-8 tracking-wide uppercase font-medium">
              Ingresá tu PIN para continuar
            </p>

            {/* Dots */}
            <div className="flex justify-center gap-4 mb-8">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                    pin.length > i
                      ? 'pin-dot-filled border-[#f97316]'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {pin.length > i && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
              ))}
            </div>

            {/* Teclado */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
                <button
                  key={idx}
                  disabled={!k || loading}
                  onClick={() => {
                    if (k === '⌫') setPin(p => p.slice(0, -1))
                    else if (pin.length < 4) setPin(p => p + k)
                  }}
                  className={`key-btn h-13 rounded-2xl text-lg font-semibold text-white/80 ${
                    k ? 'cursor-pointer' : 'invisible'
                  }`}
                  style={{ height: 52 }}
                >
                  {k === '⌫' ? (
                    <span className="text-white/40 text-sm">⌫</span>
                  ) : k}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-center text-[11px] text-red-400/80 mb-4 font-medium">{error}</p>
            )}

            <button
              onClick={verify}
              disabled={pin.length !== 4 || loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                background: pin.length === 4 && !loading
                  ? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
                  : 'rgba(249,115,22,0.2)',
                boxShadow: pin.length === 4 && !loading ? '0 8px 24px rgba(249,115,22,0.3)' : 'none',
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar →'}
            </button>
          </div>

          <p className="text-center text-[10px] text-white/15 mt-6 tracking-widest uppercase">
            Nova Agency © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
