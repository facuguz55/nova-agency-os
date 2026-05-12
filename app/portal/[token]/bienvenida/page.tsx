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
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

      {/* Fondo oscuro con gradiente */}
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f35] to-[#091422] flex items-start justify-center py-10 print:py-0 print:bg-white">
        <div
          className="print-page w-[210mm] min-h-[297mm] bg-white"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)' }}
        >

          {/* Header azul oscuro */}
          <div className="bg-[#060d18] px-10 pt-10 pb-8">
            <div className="flex items-center justify-between mb-8">
              <Image src="/logo-nova-clear.png" alt="Nova Agency" width={130} height={48} className="object-contain" />
              <p className="text-[#4a6080] text-xs">{today}</p>
            </div>

            <div>
              <p className="text-[#f97316] text-xs font-bold uppercase tracking-widest mb-1">Bienvenido a Nova Agency</p>
              <h1 className="text-3xl font-black text-white leading-tight">{client.name}</h1>
              {client.industry && <p className="text-[#94a3b8] text-sm mt-1">{client.industry}</p>}
            </div>
          </div>

          {/* Banda naranja decorativa */}
          <div className="h-1.5 bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#f97316]" />

          {/* Contenido */}
          <div className="px-10 py-8 space-y-8">

            {/* Mensaje de bienvenida */}
            <div>
              <h2 className="text-base font-bold text-[#060d18] mb-3">Nos alegra tenerte con nosotros</h2>
              <p className="text-[#4a6080] text-sm leading-relaxed">
                En <strong className="text-[#060d18]">Nova Agency</strong> trabajamos con dedicación para hacer crecer tu negocio en el mundo digital.
                Este portal es tu espacio personal donde podés seguir el progreso de tus proyectos,
                ver las tareas en curso y acceder a reportes mensuales de todo lo que hacemos juntos.
              </p>
            </div>

            {/* Nuestro equipo */}
            <div>
              <h2 className="text-base font-bold text-[#060d18] mb-4">Tu equipo</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Facundo Guzmán', role: 'Desarrollo & Automatización', wa: '549424633285', num: '+54 9 424 633 285' },
                  { name: 'Mauricio Kinkela', role: 'Estrategia & Operaciones', wa: '5493424484572', num: '+54 342 448 4572' },
                ].map(m => (
                  <div key={m.name} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="w-9 h-9 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-2">
                      <span className="text-[#f97316] font-bold text-sm">{m.name.charAt(0)}</span>
                    </div>
                    <p className="font-semibold text-[#060d18] text-sm">{m.name}</p>
                    <p className="text-[#4a6080] text-xs mb-2">{m.role}</p>
                    <a
                      href={`https://wa.me/${m.wa}`}
                      className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium no-print"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {m.num}
                    </a>
                    <p className="text-[11px] text-emerald-600 font-medium print-only hidden print:block">{m.num}</p>
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
              <div>
                <p className="text-[#4a6080] text-xs">Nova Agency · Agencia Digital</p>
                <a href="https://instagram.com/novaagencytec" className="text-[#f97316] text-xs hover:underline no-print">@novaagencytec</a>
                <p className="text-[#f97316] text-xs hidden print:block">@novaagencytec</p>
              </div>
              <p className="text-[#2a3f58] text-xs">Confidencial — uso exclusivo del cliente</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
