'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Bell, Settings, LogOut, ChevronDown, User } from 'lucide-react'
import Image from 'next/image'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const router   = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail]   = useState<string | null>(null)
  const [agencyName, setAgencyName] = useState('Nova Agency')
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null)
  const [dropOpen, setDropOpen]     = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

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
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'NA'
  const displayName = userEmail?.split('@')[0] ?? 'Usuario'

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#1a2d45] shrink-0 bg-[#0c1628] sticky top-0 z-10 gap-4">
      {/* Izquierda: título */}
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#4a6080] mt-0.5 truncate">{subtitle}</p>}
      </div>

      {/* Centro: acciones de página */}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}

      {/* Derecha: iconos + perfil */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Búsqueda */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a6080] hover:text-white hover:bg-white/5 transition-colors"
          title="Buscar (⌘K)"
        >
          <Search size={15} />
        </button>

        {/* Campana */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a6080] hover:text-white hover:bg-white/5 transition-colors relative" title="Notificaciones">
          <Bell size={15} />
        </button>

        {/* Separador */}
        <div className="w-px h-5 bg-[#1a2d45] mx-1" />

        {/* Avatar + nombre + dropdown */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-[#f97316]/15 border border-[#f97316]/25 flex items-center justify-center">
              {agencyLogo ? (
                <Image src={agencyLogo} alt={agencyName} width={28} height={28} className="object-cover w-full h-full" />
              ) : (
                <span className="text-[10px] font-black text-[#f97316]">{initials}</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-none">{displayName}</p>
              <p className="text-[10px] text-[#4a6080] mt-0.5 leading-none">{agencyName}</p>
            </div>
            <ChevronDown size={11} className={`text-[#4a6080] transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0c1628] border border-[#1a2d45] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
              {/* Info usuario */}
              <div className="px-4 py-3 border-b border-[#1a2d45]">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-[#4a6080] truncate mt-0.5">{userEmail}</p>
              </div>
              {/* Opciones */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setDropOpen(false); router.push('/config?tab=perfil') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <User size={13} /> Mi perfil
                </button>
                <button
                  onClick={() => { setDropOpen(false); router.push('/config') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Settings size={13} /> Configuración
                </button>
              </div>
              <div className="p-1.5 border-t border-[#1a2d45]">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
                >
                  <LogOut size={13} /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
