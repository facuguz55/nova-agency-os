'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        .login-display { font-family: 'Instrument Serif', serif; }

        .login-bg {
          background: #050c1a;
          position: relative;
          overflow: hidden;
        }
        .login-bg::before {
          content: '';
          position: absolute;
          inset: -60%;
          background:
            radial-gradient(ellipse at 25% 35%, rgba(249,115,22,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 65%, rgba(59,130,246,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 55% 85%, rgba(249,115,22,0.05) 0%, transparent 40%);
          animation: aurora 14s ease infinite;
          background-size: 200% 200%;
        }

        .glass-card {
          background: rgba(255,255,255,0.035);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .input-field {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 12px 14px;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.2); }
        .input-field:focus {
          border-color: rgba(249,115,22,0.4);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
        }

        .fade-up-1 { animation: fadeUp .5s ease both; }
        .fade-up-2 { animation: fadeUp .5s .1s ease both; }
        .fade-up-3 { animation: fadeUp .5s .2s ease both; }

        /* Grid pattern overlay */
        .login-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
      `}</style>

      <div className="login-font login-bg min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-[380px] relative z-10">

          {/* Logo + título */}
          <div className="text-center mb-10 fade-up-1">
            <div className="flex justify-center mb-5">
              <Image
                src="/logo-nova-dark.png"
                alt="Nova Agency"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
            <h1 className="login-display text-white" style={{ fontStyle: 'italic', fontSize: 28, letterSpacing: '-0.3px' }}>
              Sistema Operativo
            </h1>
            <p className="text-white/30 text-xs mt-1.5 font-medium tracking-widest uppercase">
              Acceso interno · Nova Agency
            </p>
          </div>

          {/* Card */}
          <div className="glass-card rounded-3xl p-7 fade-up-2">

            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl text-sm flex items-center gap-2.5"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(252,165,165,0.9)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(249,115,22,0.3)',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg style={{ animation: 'aurora 1s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Entrando...
                  </span>
                ) : 'Entrar →'}
              </button>
            </form>
          </div>

          <p className="fade-up-3 text-center text-[10px] text-white/15 mt-6 tracking-widest uppercase">
            Acceso restringido · Nova Agency © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
