'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function PortalPinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

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
      setError('PIN incorrecto. Revisá el código que te enviamos.')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#060d18] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#f97316] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-[#0d1b2e] border border-[#1a2d45] rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-1">Portal del Cliente</h1>
          <p className="text-sm text-[#4a6080] mb-8">Ingresá tu PIN de 4 dígitos para acceder</p>

          {/* PIN input */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold text-white transition-colors ${
                  pin.length > i ? 'border-[#f97316] bg-[#f97316]/10' : 'border-[#1a2d45] bg-[#060d18]'
                }`}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Teclado */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k) => (
              <button
                key={k}
                disabled={!k}
                onClick={() => {
                  if (k === '⌫') setPin(p => p.slice(0, -1))
                  else if (pin.length < 4) setPin(p => p + k)
                }}
                className={`h-12 rounded-xl text-lg font-semibold transition-all ${
                  k ? 'bg-[#1a2d45] hover:bg-[#253f60] text-white active:scale-95' : 'invisible'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 mb-4">{error}</p>
          )}

          <button
            onClick={verify}
            disabled={pin.length !== 4 || loading}
            className="w-full py-3 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-xs text-[#2a3f58] mt-6">Nova Agency © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
