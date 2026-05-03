'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    router.push('/'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#080f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#f97316] mb-4">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="10" cy="13" r="2.2" fill="white"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Nova Agency OS</h1>
          <p className="text-[#4a6080] text-sm mt-1">Sistema operativo interno</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-6">

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 bg-[#080f1e] border border-[#1a2d45] rounded-lg text-[#e2e8f0] placeholder-[#253f60] text-sm focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1.5">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-[#080f1e] border border-[#1a2d45] rounded-lg text-[#e2e8f0] placeholder-[#253f60] text-sm focus:outline-none focus:border-[#f97316]/50 focus:ring-1 focus:ring-[#f97316]/20 transition-colors"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 mt-1 btn-primary text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#253f60] text-xs mt-5">
          Acceso restringido · Nova Agency
        </p>
      </div>
    </div>
  )
}
