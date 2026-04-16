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
    <div className="min-h-screen bg-[#080f1e] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff8c42]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#a855f7]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] mb-5 shadow-[0_0_40px_rgba(255,140,66,.4)]">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="10" cy="13" r="2.5" fill="white" opacity=".9"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nova Agency OS</h1>
          <p className="text-[#475569] text-sm mt-1.5">Sistema operativo interno</p>
        </div>

        {/* Card */}
        <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-7 shadow-[0_0_60px_rgba(0,0,0,.4)]">
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff8c42]/40 to-transparent rounded-t-2xl" />

          <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-widest mb-6">Acceso</h2>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] uppercase tracking-widest mb-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[#080f1e] border border-[#1e2f4a] rounded-xl text-white placeholder-[#1e2f4a] text-sm focus:outline-none focus:border-[#ff8c42]/50 focus:shadow-[0_0_0_3px_rgba(255,140,66,.08)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] uppercase tracking-widest mb-2">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#080f1e] border border-[#1e2f4a] rounded-xl text-white placeholder-[#1e2f4a] text-sm focus:outline-none focus:border-[#ff8c42]/50 focus:shadow-[0_0_0_3px_rgba(255,140,66,.08)] transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 mt-2 btn-primary text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>
                  Entrando...
                </span>
              ) : 'Entrar →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#1e2f4a] text-xs mt-6 tracking-widest uppercase">
          Acceso restringido · Nova Agency
        </p>
      </div>
    </div>
  )
}
