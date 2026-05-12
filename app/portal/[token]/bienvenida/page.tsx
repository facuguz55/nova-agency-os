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
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
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
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        @page { margin: 0; size: A4 portrait; }
      `}</style>

      {/* Botón imprimir */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#f97316] hover:bg-[#fb923c] text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
        >
          Descargar PDF
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 print:py-0 print:bg-white">
        <div className="print-page w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none">

          {/* Header con gradiente */}
          <div className="bg-[#060d18] px-10 pt-10 pb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f97316] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-none">Nova Agency</p>
                  <p className="text-[#4a6080] text-xs">Agencia Digital</p>
                </div>
              </div>
              <p className="text-[#4a6080] text-xs">{today}</p>
            </div>

            <div>
              <p className="text-[#f97316] text-xs font-bold uppercase tracking-widest mb-1">Bienvenido</p>
              <h1 className="text-3xl font-black text-white leading-tight">{client.name}</h1>
              {client.industry && <p className="text-[#94a3b8] text-sm mt-1">{client.industry}</p>}
            </div>
          </div>

          {/* Contenido */}
          <div className="px-10 py-8 space-y-8">

            {/* Mensaje de bienvenida */}
            <div>
              <h2 className="text-base font-bold text-[#060d18] mb-3">Nos alegra tenerte con nosotros</h2>
              <p className="text-[#4a6080] text-sm leading-relaxed">
                En Nova Agency trabajamos con dedicación para hacer crecer tu negocio en el mundo digital.
                Este portal es tu espacio personal donde podés seguir el progreso de tus proyectos,
                ver las tareas en curso y acceder a reportes mensuales de todo lo que hacemos juntos.
              </p>
            </div>

            {/* Nuestro equipo */}
            <div>
              <h2 className="text-base font-bold text-[#060d18] mb-4">Tu equipo</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Facundo Guzmán', role: 'Desarrollo & Automatización' },
                  { name: 'Mauricio Kinkela', role: 'Estrategia & Operaciones' },
                ].map(m => (
                  <div key={m.name} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="w-9 h-9 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-2">
                      <span className="text-[#f97316] font-bold text-sm">{m.name.charAt(0)}</span>
                    </div>
                    <p className="font-semibold text-[#060d18] text-sm">{m.name}</p>
                    <p className="text-[#4a6080] text-xs">{m.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyectos activos */}
            {activeProjects.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[#060d18] mb-4">Proyectos en curso</h2>
                <div className="space-y-2">
                  {activeProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                        <p className="text-sm font-medium text-[#060d18]">{p.name}</p>
                      </div>
                      {p.budget && <p className="text-sm text-[#4a6080]">${Number(p.budget).toLocaleString('es-AR')}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compromisos */}
            <div>
              <h2 className="text-base font-bold text-[#060d18] mb-4">Nuestro compromiso con vos</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { title: 'Transparencia total', desc: 'Accedés en tiempo real al estado de todo el trabajo.' },
                  { title: 'Resultados medibles', desc: 'Cada mes recibís un reporte detallado de lo que logramos.' },
                  { title: 'Comunicación directa', desc: 'Nuestro equipo está disponible para cualquier consulta.' },
                ].map(c => (
                  <div key={c.title} className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#060d18]">{c.title}</p>
                      <p className="text-xs text-[#4a6080]">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="bg-[#060d18] px-10 py-6 mt-8">
            <div className="flex items-center justify-between">
              <p className="text-[#4a6080] text-xs">Nova Agency · Agencia Digital</p>
              <p className="text-[#2a3f58] text-xs">Confidencial — uso exclusivo del cliente</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
