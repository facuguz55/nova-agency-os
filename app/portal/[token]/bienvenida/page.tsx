'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface PortalData {
  client: { name: string; email: string | null; industry: string | null; contact_person: string | null; created_at: string }
  projects: Array<{ name: string; status: string; budget: number | null }>
}

export default function PortalBienvenida() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()
  const [data, setData]     = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pin = localStorage.getItem(`portal_pin_${token}`)
    if (!pin) { router.replace(`/portal/${token}`); return }
    fetch(`/api/portal/${token}/data?pin=${pin}`)
      .then(r => r.status === 401 ? null : r.json())
      .then(json => { if (json) setData(json) })
      .finally(() => setLoading(false))
  }, [token, router])

  if (loading) return null
  if (!data) return null

  const { client, projects } = data
  const activeProjects = projects.filter(p => p.status === 'active')
  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; }
          .print-bg { background: #060d18 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { margin: 0; size: A4 portrait; }

        .doc-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        .display-font { font-family: 'Cormorant Garamond', serif; }
      `}</style>

      {/* Botón imprimir */}
      <div className="no-print fixed right-5 z-50 flex gap-2" style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <a href={`/portal/${token}/inicio`}
          className="px-4 py-2 text-sm font-semibold rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
          ← Volver
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
        >
          Descargar PDF
        </button>
      </div>

      {/* Fondo pantalla — azul oscuro profundo */}
      <div className="doc-font min-h-screen flex items-start justify-center py-12 print:py-0 print:bg-white"
        style={{ background: 'linear-gradient(160deg, #030810 0%, #08152a 40%, #0a1a35 100%)' }}>

        {/* Documento */}
        <div
          className="print-page w-[210mm] min-h-[297mm] bg-white overflow-hidden"
          style={{ borderRadius: 12, boxShadow: '0 48px 96px rgba(0,0,0,0.7), 0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
        >

          {/* Header — negro profundo */}
          <div className="print-bg relative overflow-hidden px-12 pt-12 pb-10" style={{ background: '#060d18' }}>
            {/* Patrón de fondo sutil */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #f97316 0%, transparent 50%), radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%)' }} />

            <div className="relative flex items-start justify-between mb-10">
              <Image src="/logo-nova-clear.png" alt="Nova Agency" width={64} height={64} className="object-contain" />
              <div className="text-right">
                <p className="text-white/20 text-[10px] uppercase tracking-[.15em] font-semibold">Documento de bienvenida</p>
                <p className="text-white/30 text-xs mt-1">{today}</p>
              </div>
            </div>

            {/* División naranja */}
            <div className="w-16 h-[3px] rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />

            <p className="text-[#f97316] text-[10px] font-bold uppercase tracking-[.2em] mb-2">Bienvenido a Nova Agency</p>
            <h1 className="display-font text-white leading-none" style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-1px' }}>
              {client.name}
            </h1>
            {client.industry && (
              <p className="text-white/35 text-sm mt-2 font-medium">{client.industry}</p>
            )}
          </div>

          {/* Banda decorativa */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%)' }} />

          {/* Cuerpo */}
          <div className="px-12 py-10 space-y-9">

            {/* Mensaje */}
            <div>
              <h2 className="display-font text-[#060d18] mb-3" style={{ fontSize: 22, fontWeight: 600 }}>
                Nos alegra tenerte con nosotros
              </h2>
              <p className="text-[#4a6080] text-[13px] leading-relaxed" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                En <strong className="text-[#060d18]">Nova Agency</strong> trabajamos con dedicación para hacer crecer tu negocio en el mundo digital.
                Este portal es tu espacio personal donde podés seguir el progreso de tus proyectos,
                ver las tareas en curso y acceder a reportes mensuales de todo lo que hacemos juntos.
              </p>
            </div>

            {/* Equipo */}
            <div>
              <h2 className="display-font text-[#060d18] mb-5" style={{ fontSize: 22, fontWeight: 600 }}>Tu equipo</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Facundo Guzmán', role: 'Desarrollo & Automatización', wa: '549424633285', num: '+54 9 424 633 285' },
                  { name: 'Mauricio Kinkela', role: 'Estrategia & Operaciones',  wa: '5493424484572', num: '+54 342 448 4572' },
                ].map(m => (
                  <div key={m.name} className="rounded-2xl p-5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base mb-3"
                      style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                      {m.name.charAt(0)}
                    </div>
                    <p className="font-bold text-[#060d18] text-[14px] leading-tight">{m.name}</p>
                    <p className="text-[#94a3b8] text-[11px] mt-0.5 mb-3">{m.role}</p>
                    <a
                      href={`https://wa.me/${m.wa}`}
                      className="no-print flex items-center gap-2 text-[11px] font-semibold"
                      style={{ color: '#16a34a' }}
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {m.num}
                    </a>
                    <p className="hidden print:block text-[11px] font-semibold" style={{ color: '#16a34a' }}>{m.num}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyectos activos */}
            {activeProjects.length > 0 && (
              <div>
                <h2 className="display-font text-[#060d18] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
                  Proyectos en curso
                </h2>
                <div className="space-y-2">
                  {activeProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 border-b"
                      style={{ borderColor: '#f1f5f9' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />
                        <p className="text-[14px] font-semibold text-[#0f172a]">{p.name}</p>
                      </div>
                      {p.budget && (
                        <p className="text-[12px] text-[#94a3b8] font-medium">
                          ${Number(p.budget).toLocaleString('es-AR')} ARS
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compromisos */}
            <div>
              <h2 className="display-font text-[#060d18] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
                Nuestro compromiso
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { title: 'Transparencia', desc: 'Accedés en tiempo real al estado de tu trabajo.' },
                  { title: 'Resultados',    desc: 'Reporte mensual detallado de todo lo que logramos.' },
                  { title: 'Comunicación', desc: 'Tu equipo disponible para cualquier consulta.' },
                ].map(c => (
                  <div key={c.title} className="rounded-2xl p-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <p className="text-[12px] font-bold text-[#9a3412] mb-1">{c.title}</p>
                    <p className="text-[11px] text-[#7c2d12] leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="print-bg px-12 py-6 flex items-center justify-between" style={{ background: '#060d18', marginTop: 'auto' }}>
            <div>
              <p className="text-white/40 text-[11px] font-medium">Nova Agency · Agencia Digital</p>
              <a href="https://instagram.com/novaagencytec" target="_blank" rel="noreferrer"
                className="no-print text-[#f97316]/70 text-[11px] hover:text-[#f97316] transition-colors">
                @novaagencytec
              </a>
              <p className="hidden print:block text-[#f97316]/60 text-[11px]">@novaagencytec</p>
            </div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest">Confidencial</p>
          </div>

        </div>
      </div>
    </>
  )
}
