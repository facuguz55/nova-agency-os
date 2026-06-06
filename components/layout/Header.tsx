'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Bell, Settings, LogOut, ChevronDown, User, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumb?: string
}

export default function Header({ title, subtitle, actions, breadcrumb }: HeaderProps) {
  const router   = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail]   = useState<string | null>(null)
  const [agencyName, setAgencyName] = useState('Nova Agency')
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null)
  const [dropOpen, setDropOpen]     = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)
  const dropRef   = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    fetch('/api/app-config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.agency_name) setAgencyName(cfg.agency_name)
        if (cfg.agency_logo) setAgencyLogo(cfg.agency_logo)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials    = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'NA'
  const displayName = userEmail?.split('@')[0] ?? 'Usuario'

  return (
    <header className="h-[56px] flex items-center justify-between px-6 border-b border-[rgba(255,255,255,0.07)] shrink-0 bg-[#080808]/90 sticky top-0 z-20 backdrop-blur-xl gap-4">

      {/* Breadcrumb + título */}
      <div className="min-w-0 flex items-center gap-2">
        {breadcrumb && (
          <>
            <Link href="/" className="text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
              {breadcrumb}
            </Link>
            <ChevronRight size={11} className="text-[var(--text-4)] shrink-0" />
          </>
        )}
        <div>
          <h1 className="text-[13px] font-semibold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          {subtitle && <p className="text-[11px] text-[var(--text-3)] mt-px truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Acciones de página */}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}

      {/* Iconos + perfil */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Búsqueda */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-white/5 transition-all"
          title="Buscar (⌘K)"
        >
          <Search size={14} />
        </button>

        {/* Campana */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-white/5 transition-all relative"
            title="Notificaciones"
          >
            <Bell size={14} />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.07)]">
                <p className="text-[12px] font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Notificaciones</p>
              </div>
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] text-[var(--text-3)]">Sin notificaciones nuevas</p>
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" />

        {/* Avatar + dropdown */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[.04] transition-all"
          >
            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-[var(--amber-dim)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center">
              {agencyLogo ? (
                <Image src={agencyLogo} alt={agencyName} width={24} height={24} className="object-cover w-full h-full" />
              ) : (
                <span className="text-[9px] font-bold text-[var(--amber)]" style={{ fontFamily: 'var(--font-display)' }}>{initials}</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-medium text-white/90 leading-none">{displayName}</p>
            </div>
            <ChevronDown size={10} className={`text-[var(--text-3)] transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.07)]">
                <p className="text-[12px] font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-[var(--text-3)] truncate mt-0.5">{userEmail}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setDropOpen(false); router.push('/config?tab=perfil') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[var(--text-2)] hover:text-white hover:bg-white/[.04] transition-all text-left"
                >
                  <User size={12} /> Mi perfil
                </button>
                <button
                  onClick={() => { setDropOpen(false); router.push('/config') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[var(--text-2)] hover:text-white hover:bg-white/[.04] transition-all text-left"
                >
                  <Settings size={12} /> Configuración
                </button>
              </div>
              <div className="p-1.5 border-t border-[rgba(255,255,255,0.07)]">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[.05] transition-all text-left"
                >
                  <LogOut size={12} /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
