'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

export default function TerminosPage() {
  const { token }  = useParams<{ token: string }>()
  const router     = useRouter()

  const [scrolled,  setScrolled]  = useState(false)
  const [checked,   setChecked]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(true) // verifica en servidor si ya aceptó
  const scrollRef  = useRef<HTMLDivElement>(null)

  // Si ya aceptó (localStorage o servidor), ir directo a inicio
  useEffect(() => {
    const tos = localStorage.getItem(`portal_tos_${token}`)
    if (tos) { router.replace(`/portal/${token}/inicio`); return }

    // Verificar en servidor (caso: nuevo dispositivo, localStorage limpio)
    const pin = localStorage.getItem(`portal_pin_${token}`)
    if (!pin) { router.replace(`/portal/${token}`); return }

    fetch(`/api/portal/${token}/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pin }),
    })
      .then(r => r.json())
      .then(json => {
        if (!json.ok) { router.replace(`/portal/${token}`); return }
        if (json.tos_accepted) {
          localStorage.setItem(`portal_tos_${token}`, '1')
          router.replace(`/portal/${token}/inicio`)
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [token, router])

  // Detectar scroll al final del documento
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    if (atBottom) setScrolled(true)
  }

  async function handleAccept() {
    if (!checked || loading) return
    setLoading(true)
    const pin = localStorage.getItem(`portal_pin_${token}`)
    const res = await fetch(`/api/portal/${token}/accept-tos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pin }),
    })
    const json = await res.json()
    if (json.ok) {
      localStorage.setItem(`portal_tos_${token}`, '1')
      router.push(`/portal/${token}/inicio`)
    } else {
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp .5s ease both; }
        .fu2 { animation: fadeUp .5s .1s ease both; }
        .tos-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .portal-bg {
          background: #050c1a;
        }
        .glass {
          background: rgba(13, 27, 46, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .tos-scroll::-webkit-scrollbar { width: 4px; }
        .tos-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
        .tos-scroll::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 4px; }
        .tos-scroll::-webkit-scrollbar-thumb:hover { background: rgba(249,115,22,0.5); }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .14em;
          color: #f97316;
          margin-top: 28px;
          margin-bottom: 10px;
          display: block;
        }
        .clause {
          font-size: 13px;
          line-height: 1.75;
          color: rgba(255,255,255,0.55);
          margin-bottom: 10px;
        }
        .clause strong {
          color: rgba(255,255,255,0.75);
          font-weight: 600;
        }
        .clause-num {
          color: #f97316;
          font-weight: 700;
          margin-right: 6px;
        }
        .fade-top {
          background: linear-gradient(to bottom, #050c1a 0%, transparent 100%);
          pointer-events: none;
        }
        .fade-bottom {
          background: linear-gradient(to top, #050c1a 0%, transparent 100%);
          pointer-events: none;
        }
        .checkbox-custom {
          width: 20px; height: 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all .2s ease;
          flex-shrink: 0;
        }
        .checkbox-custom.active {
          border-color: #f97316;
          background: rgba(249,115,22,0.15);
        }
      `}</style>

      <div className="portal-bg tos-body min-h-screen flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050c1a]/90 backdrop-blur-xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0" style={{ background: '#0d1828' }}>
            <Image src="/logo-nova-dark.png" alt="Nova Agency" width={32} height={32} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white/80 leading-none">Términos y Condiciones</p>
            <p className="text-[10px] text-white/30 mt-0.5">Nova Agency · Revisá antes de continuar</p>
          </div>
        </header>

        {/* Indicador de progreso de lectura */}
        <div className="relative h-0.5 bg-white/[0.05]">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-300"
            style={{
              width: scrolled ? '100%' : '0%',
              background: 'linear-gradient(90deg, #f97316, #fb923c)',
            }}
          />
        </div>

        {/* Aviso superior */}
        <div className="fu px-5 pt-5 pb-0 max-w-xl mx-auto w-full">
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}>
            <span className="text-lg leading-none mt-0.5">📋</span>
            <div>
              <p className="text-[12px] font-semibold text-white/80 leading-tight">Leé el documento completo</p>
              <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">
                Scrolleá hasta el final para poder aceptar. Solo podés continuar al portal después de aceptar.
              </p>
            </div>
          </div>
        </div>

        {/* Documento T&C scrolleable */}
        <div className="flex-1 px-5 pt-5 pb-0 max-w-xl mx-auto w-full relative">
          <div className="relative">
            {/* Fade top */}
            <div className="fade-top absolute top-0 left-0 right-0 h-6 z-10" />

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="glass rounded-3xl tos-scroll overflow-y-auto fu2"
              style={{ maxHeight: 'calc(100vh - 320px)', minHeight: 240 }}
            >
              <div className="px-6 py-6">

                {/* Intro */}
                <p className="text-[12px] text-white/40 leading-relaxed mb-2">
                  Al acceder y utilizar el Portal del Cliente de Nova Agency, el cliente declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones.
                  Nova Agency se reserva el derecho de modificar estos términos en cualquier momento. Los términos actualizados estarán siempre disponibles en este portal.
                </p>

                {/* 1. PAGOS */}
                <span className="section-title">1. Condiciones de pago</span>

                <p className="clause"><span className="clause-num">1.1</span>
                  Todo proyecto o servicio debe abonarse <strong>en su totalidad antes del inicio de los trabajos</strong>. Nova Agency no comenzará ninguna tarea hasta confirmar la acreditación del pago correspondiente.
                </p>
                <p className="clause"><span className="clause-num">1.2</span>
                  Los servicios de carácter mensual se abonan en la <strong>fecha acordada entre las partes</strong>, la cual quedará establecida al inicio del vínculo comercial. El no pago en dicha fecha implica la suspensión automática del servicio, previa notificación al cliente.
                </p>
                <p className="clause"><span className="clause-num">1.3</span>
                  Nova Agency podrá otorgar un período de gracia a su exclusivo criterio. Vencido dicho período sin que se regularice la situación, los trabajos quedarán <strong>pausados o cancelados</strong> sin responsabilidad para la agencia.
                </p>
                <p className="clause"><span className="clause-num">1.4</span>
                  Los accesos, archivos finales y entregables serán puestos a disposición del cliente únicamente <strong>al momento de completar el trabajo y verificarse el pago total</strong>.
                </p>
                <p className="clause"><span className="clause-num">1.5</span>
                  La emisión de comprobantes fiscales electrónicos aplicará únicamente a proyectos o contratos de carácter formal, según lo acordado con el cliente.
                </p>

                {/* 2. REVISIONES */}
                <span className="section-title">2. Revisiones y aprobaciones</span>

                <p className="clause"><span className="clause-num">2.1</span>
                  Cada entregable incluye un número de rondas de revisión acordado al inicio del proyecto. Las correcciones adicionales que excedan dicho límite tendrán un <strong>costo adicional</strong> presupuestado previamente.
                </p>
                <p className="clause"><span className="clause-num">2.2</span>
                  Si el cliente no responde ni aprueba un entregable dentro de los <strong>3 días hábiles</strong> siguientes a su envío, se considerará <strong>aprobado tácitamente</strong> y el proyecto avanzará a la siguiente etapa.
                </p>
                <p className="clause"><span className="clause-num">2.3</span>
                  Toda aprobación, solicitud de cambio o instrucción deberá realizarse <strong>por escrito vía WhatsApp o correo electrónico</strong>. No se tomarán como válidas las indicaciones verbales.
                </p>
                <p className="clause"><span className="clause-num">2.4</span>
                  Los cambios solicitados después de haber aprobado un entregable final constituyen una <strong>modificación de alcance</strong> y tendrán costo adicional.
                </p>

                {/* 3. PROPIEDAD INTELECTUAL */}
                <span className="section-title">3. Propiedad intelectual y entregables</span>

                <p className="clause"><span className="clause-num">3.1</span>
                  Los materiales diseñados, desarrollados o producidos por Nova Agency son propiedad de la agencia hasta tanto se acredite el <strong>pago íntegro</strong> del proyecto o servicio.
                </p>
                <p className="clause"><span className="clause-num">3.2</span>
                  Los <strong>flujos de trabajo, automatizaciones y workflows de n8n</strong> desarrollados por Nova Agency son de uso exclusivo de la agencia. No constituyen un entregable y no serán cedidos, compartidos ni transferidos bajo ninguna circunstancia. El cliente no tiene derecho a solicitar, copiar ni reproducir dichos activos.
                </p>
                <p className="clause"><span className="clause-num">3.3</span>
                  Nova Agency podrá utilizar los trabajos realizados como parte de su <strong>portfolio y material de difusión</strong>, salvo que el cliente solicite expresamente confidencialidad por escrito.
                </p>
                <p className="clause"><span className="clause-num">3.4</span>
                  El cliente declara ser titular o contar con los derechos necesarios sobre todos los materiales que entregue (imágenes, textos, logotipos, marcas), asumiendo total responsabilidad ante cualquier reclamo de terceros.
                </p>
                <p className="clause"><span className="clause-num">3.5</span>
                  Los costos de licencias, fuentes tipográficas, imágenes stock, plugins o cualquier activo de terceros requerido correrán <strong>por cuenta del cliente</strong>.
                </p>

                {/* 4. CUENTAS Y ACCESOS */}
                <span className="section-title">4. Cuentas, accesos y servidores</span>

                <p className="clause"><span className="clause-num">4.1</span>
                  El cliente es responsable de contar con sus propias cuentas activas en las plataformas necesarias: <strong>Google, Meta, TiendaNube, Shopify</strong> y cualquier otra que corresponda. Nova Agency opera en nombre del cliente pero <strong>nunca asume la titularidad</strong> de dichas cuentas.
                </p>
                <p className="clause"><span className="clause-num">4.2</span>
                  Para operar de manera efectiva, Nova Agency solicitará <strong>acceso con permisos de administrador completos</strong> a las cuentas del cliente, incluyendo datos necesarios para el desarrollo de aplicaciones. El cliente se compromete a otorgar dicho acceso de forma oportuna.
                </p>
                <p className="clause"><span className="clause-num">4.3</span>
                  La infraestructura de servidores operada por Nova Agency es de <strong>propiedad exclusiva de la agencia</strong> y no forma parte de ningún entregable al cliente.
                </p>
                <p className="clause"><span className="clause-num">4.4</span>
                  Al finalizar el vínculo comercial, el cliente deberá <strong>revocar los accesos otorgados</strong> y modificar las contraseñas compartidas durante la relación de trabajo.
                </p>

                {/* 5. COMUNICACIÓN */}
                <span className="section-title">5. Comunicación</span>

                <p className="clause"><span className="clause-num">5.1</span>
                  El canal oficial de comunicación es <strong>WhatsApp</strong>. Todas las consultas, aprobaciones y solicitudes deben canalizarse por esta vía para garantizar trazabilidad y evitar malentendidos.
                </p>
                <p className="clause"><span className="clause-num">5.2</span>
                  Las reuniones de trabajo deberán coordinarse con <strong>anticipación mínima acordada</strong>. Nova Agency no garantiza disponibilidad inmediata sin coordinación previa.
                </p>
                <p className="clause"><span className="clause-num">5.3</span>
                  Nova Agency no opera los días <strong>sábado, domingo ni feriados nacionales</strong>, salvo situaciones de urgencia debidamente justificadas y acordadas con el equipo.
                </p>

                {/* 6. PLAZOS */}
                <span className="section-title">6. Plazos y entregas</span>

                <p className="clause"><span className="clause-num">6.1</span>
                  Los plazos están condicionados a la provisión oportuna de materiales e información por parte del cliente. Toda demora imputable al cliente <strong>extiende automáticamente el plazo</strong> en igual proporción, sin responsabilidad para Nova Agency.
                </p>
                <p className="clause"><span className="clause-num">6.2</span>
                  Nova Agency no será responsable por demoras causadas por <strong>fuerza mayor</strong>: caídas de plataformas, interrupciones de servicios de terceros, cambios en políticas de proveedores o cualquier causa ajena al control razonable de la agencia.
                </p>
                <p className="clause"><span className="clause-num">6.3</span>
                  Si un proyecto queda detenido por inacción del cliente durante <strong>30 días hábiles o más</strong>, Nova Agency podrá cobrar un cargo de reinicio antes de retomar los trabajos.
                </p>

                {/* 7. CONFIDENCIALIDAD */}
                <span className="section-title">7. Confidencialidad y subcontratistas</span>

                <p className="clause"><span className="clause-num">7.1</span>
                  Nova Agency se compromete a mantener la <strong>confidencialidad de la información del cliente</strong> y no compartirla con terceros ajenos al proyecto, salvo requerimiento legal o autorización expresa.
                </p>
                <p className="clause"><span className="clause-num">7.2</span>
                  A pedido del cliente, Nova Agency está disponible para suscribir un <strong>Acuerdo de No Divulgación (NDA)</strong> adicional y específico.
                </p>
                <p className="clause"><span className="clause-num">7.3</span>
                  Nova Agency podrá trabajar con <strong>colaboradores o subcontratistas</strong> para el desarrollo de los proyectos. Dicha colaboración se realiza bajo la responsabilidad de la agencia y no requiere aprobación del cliente.
                </p>

                {/* 8. GARANTÍAS Y LIMITACIONES */}
                <span className="section-title">8. Garantías y limitaciones de responsabilidad</span>

                <p className="clause"><span className="clause-num">8.1</span>
                  Nova Agency aplica las mejores prácticas disponibles en cada proyecto. Sin embargo, <strong>no garantiza resultados específicos</strong> en términos de ventas, conversiones, posicionamiento, seguidores, descargas ni ningún otro indicador de performance. Esto aplica especialmente a servicios de marketing digital, aplicaciones y automatizaciones.
                </p>
                <p className="clause"><span className="clause-num">8.2</span>
                  Nova Agency no es responsable por cambios en <strong>algoritmos, políticas, interfaces o interrupciones</strong> de plataformas de terceros (Meta, Google, TiendaNube, Shopify, entre otras) que puedan afectar el rendimiento de los servicios contratados.
                </p>
                <p className="clause"><span className="clause-num">8.3</span>
                  Nova Agency no se hace responsable por errores o fallas causadas por <strong>actualizaciones de plataformas o sistemas externos</strong> sobre los cuales no tiene control.
                </p>
                <p className="clause"><span className="clause-num">8.4</span>
                  Si algo desarrollado directamente por Nova Agency presenta fallas técnicas dentro de los <strong>14 días posteriores a la entrega</strong>, la agencia lo corregirá <strong>sin costo adicional</strong>, siempre que la falla sea atribuible a un error propio y no a modificaciones externas o del cliente. Pasado dicho período, toda corrección tendrá costo.
                </p>
                <p className="clause"><span className="clause-num">8.5</span>
                  El cliente podrá contratar un <strong>servicio de mantenimiento mensual</strong> con Nova Agency para cubrir soporte técnico, actualizaciones y correcciones de forma continua.
                </p>
                <p className="clause"><span className="clause-num">8.6</span>
                  Nova Agency no es responsable por la realización de copias de seguridad de las cuentas o plataformas propias del cliente. En los casos en que la agencia administre directamente determinados activos o infraestructura, asumirá la responsabilidad correspondiente sobre los backups de lo que gestiona.
                </p>

                {/* 9. CANCELACIÓN */}
                <span className="section-title">9. Rescisión y cancelación</span>

                <p className="clause"><span className="clause-num">9.1</span>
                  Los servicios de carácter mensual se mantienen vigentes mientras el cliente <strong>abone el mes en curso</strong>. El no pago implica la cancelación automática del servicio.
                </p>
                <p className="clause"><span className="clause-num">9.2</span>
                  Nova Agency se reserva el derecho de <strong>rescindir el contrato de forma inmediata y sin devolución</strong> si el cliente incurre en: hostigamiento, agresión verbal o conducta inapropiada hacia cualquier miembro del equipo; mora reiterada o incumplimiento sistemático; o violación de cualquiera de los presentes términos.
                </p>

                {/* 10. DISPOSICIONES GENERALES */}
                <span className="section-title">10. Disposiciones generales</span>

                <p className="clause"><span className="clause-num">10.1</span>
                  Los presentes Términos y Condiciones se rigen por las leyes de la <strong>República Argentina</strong>. Ante cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de la <strong>ciudad de Santa Fe</strong>, renunciando a cualquier otro fuero.
                </p>
                <p className="clause"><span className="clause-num">10.2</span>
                  Todos los contenidos, materiales, nombre comercial, marca e identidad de <strong>Nova Agency</strong> se encuentran protegidos. Todos los derechos reservados © Nova Agency.
                </p>
                <p className="clause"><span className="clause-num">10.3</span>
                  Nova Agency podrá actualizar los presentes términos en cualquier momento. La versión vigente estará siempre disponible en el portal del cliente. El uso continuado del portal implica la aceptación de los términos actualizados.
                </p>

                {/* Spacer final para que el scroll llegue bien */}
                <div className="h-4" />
              </div>
            </div>

            {/* Fade bottom */}
            {!scrolled && (
              <div className="fade-bottom absolute bottom-0 left-0 right-0 h-12 z-10 flex items-end justify-center pb-2">
                <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-medium animate-bounce">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                  Seguí leyendo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: checkbox + botón */}
        <div className="sticky bottom-0 px-5 pb-6 pt-4 max-w-xl mx-auto w-full"
          style={{ background: 'linear-gradient(to top, #050c1a 70%, transparent 100%)' }}>

          {/* Checkbox */}
          <button
            disabled={!scrolled}
            onClick={() => scrolled && setChecked(c => !c)}
            className="w-full flex items-center gap-3 mb-4 disabled:opacity-30"
          >
            <div className={`checkbox-custom ${checked ? 'active' : ''}`}>
              {checked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
            <p className={`text-[13px] text-left leading-snug transition-colors ${scrolled ? 'text-white/60' : 'text-white/25'}`}>
              Leí y acepto los Términos y Condiciones de Nova Agency
            </p>
          </button>

          {/* Botón Acepto */}
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{
              background: checked && !loading
                ? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
                : 'rgba(249,115,22,0.15)',
              boxShadow: checked && !loading ? '0 8px 24px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".25"/>
                  <path d="M21 12a9 9 0 00-9-9"/>
                </svg>
                Guardando...
              </span>
            ) : (
              'Acepto y entrar al portal →'
            )}
          </button>

          {!scrolled && (
            <p className="text-center text-[10px] text-white/20 mt-3">
              Scrolleá hasta el final del documento para poder aceptar
            </p>
          )}
        </div>

      </div>
    </>
  )
}
