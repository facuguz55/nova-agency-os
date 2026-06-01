'use client'

import { useState } from 'react'

interface Props { invoiceId: string }

type ExportFormat = 'pdf' | 'png' | 'jpg'

export default function PrintButtons({ invoiceId }: Props) {
  const [enhancing,  setEnhancing]  = useState(false)
  const [enhanced,   setEnhanced]   = useState(false)
  const [exporting,  setExporting]  = useState<ExportFormat | null>(null)

  async function captureInvoice() {
    const html2canvas = (await import('html2canvas')).default
    const element = document.querySelector('.invoice') as HTMLElement
    if (!element) throw new Error('invoice element not found')

    const prevShadow = element.style.boxShadow
    element.style.boxShadow = 'none'

    try {
      return await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        windowWidth: element.offsetWidth,
        backgroundColor: '#ffffff',
      })
    } finally {
      element.style.boxShadow = prevShadow
    }
  }

  async function handleDownloadPDF() {
    setExporting('pdf')
    try {
      const canvas   = await captureInvoice()
      const { jsPDF } = await import('jspdf')

      // Página A4 en ancho (210mm), altura proporcional al contenido → siempre una sola página
      const pageWidthMm  = 210
      const pageHeightMm = (canvas.height / canvas.width) * pageWidthMm

      const pdf = new jsPDF({ unit: 'mm', format: [pageWidthMm, pageHeightMm], orientation: 'portrait' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidthMm, pageHeightMm)
      pdf.save(`factura-${invoiceId}.pdf`)
    } catch (e) { console.error(e) }
    setExporting(null)
  }

  async function handleDownloadImage(fmt: 'png' | 'jpg') {
    setExporting(fmt)
    try {
      const canvas = await captureInvoice()
      const mimeType = fmt === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality  = fmt === 'jpg' ? 0.95 : undefined

      const link = document.createElement('a')
      link.download = `factura-${invoiceId}.${fmt}`
      link.href = canvas.toDataURL(mimeType, quality)
      link.click()
    } catch (e) { console.error(e) }
    setExporting(null)
  }

  async function handleEnhance() {
    setEnhancing(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/enhance`, { method: 'POST' })
      if (res.ok) {
        const { structured } = await res.json()
        const el = document.getElementById('invoice-description')
        if (el && structured) {
          el.innerHTML = buildHTML(structured)
          setEnhanced(true)
        }
      }
    } catch { /* silencioso */ }
    setEnhancing(false)
  }

  function esc(str: string): string {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
  }

  function buildHTML(s: { titulo: string; resumen: string; entregables: string[]; periodo: string | null; nota: string | null }) {
    const items = (s.entregables || [])
      .map((e: string) => `<li style="margin:3px 0;padding-left:4px;">${esc(e)}</li>`)
      .join('')
    return `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;">
        <p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 6px 0;letter-spacing:-.2px;">${esc(s.titulo)}</p>
        <p style="font-size:12.5px;color:#475569;margin:0 0 10px 0;line-height:1.5;">${esc(s.resumen)}</p>
        ${items ? `<ul style="margin:0 0 10px 0;padding-left:16px;color:#334155;font-size:12px;line-height:1.6;">${items}</ul>` : ''}
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          ${s.periodo ? `<span style="font-size:10.5px;color:#94a3b8;font-weight:500;">${esc(s.periodo)}</span>` : ''}
          ${s.nota    ? `<span style="font-size:10.5px;color:#94a3b8;font-style:italic;">${esc(s.nota)}</span>` : ''}
        </div>
      </div>`
  }

  const spinnerSvg = (
    <svg style={{ animation: 'spin .8s linear infinite', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )

  return (
    <div className="no-print">
      {/* Volver */}
      <button onClick={() => window.history.back()} className="btn-back">← Volver</button>

      {/* Mejorar con IA */}
      <button onClick={handleEnhance} disabled={enhancing || enhanced} className="btn-enhance">
        {enhancing
          ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>{spinnerSvg}Mejorando...</span>
          : enhanced ? '✓ Mejorado con IA' : '✦ Mejorar con IA'}
      </button>

      {/* Imprimir */}
      <button onClick={() => window.print()} className="btn-print">Imprimir</button>

      {/* Descargar PDF */}
      <button onClick={handleDownloadPDF} disabled={exporting !== null} className="btn-download btn-pdf">
        {exporting === 'pdf'
          ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>{spinnerSvg}Generando...</span>
          : '↓ PDF'}
      </button>

      {/* Descargar PNG */}
      <button onClick={() => handleDownloadImage('png')} disabled={exporting !== null} className="btn-download btn-img">
        {exporting === 'png'
          ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>{spinnerSvg}...</span>
          : '↓ PNG'}
      </button>

      {/* Descargar JPG */}
      <button onClick={() => handleDownloadImage('jpg')} disabled={exporting !== null} className="btn-download btn-img">
        {exporting === 'jpg'
          ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>{spinnerSvg}...</span>
          : '↓ JPG'}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-print {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; gap: 8px; z-index: 100; align-items: center;
        }
        .btn-back {
          padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s;
        }
        .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
        .btn-enhance {
          padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: 1px solid rgba(167,139,250,0.35);
          background: rgba(167,139,250,0.1); color: rgba(196,181,253,0.9);
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s; min-width: 152px; text-align: center;
        }
        .btn-enhance:hover:not(:disabled) { background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.5); }
        .btn-enhance:disabled { opacity: .6; cursor: not-allowed; }
        .btn-print {
          padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: 1px solid rgba(249,115,22,0.3);
          background: rgba(249,115,22,0.08); color: #fb923c;
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s;
        }
        .btn-print:hover { background: rgba(249,115,22,0.16); }
        .btn-download {
          padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .15s; text-align: center; min-width: 72px;
        }
        .btn-download:disabled { opacity: .6; cursor: not-allowed; }
        .btn-pdf {
          background: linear-gradient(135deg, #f97316, #fb923c); color: white;
          box-shadow: 0 4px 14px rgba(249,115,22,0.35); min-width: 100px;
        }
        .btn-pdf:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-img {
          background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.15) !important;
          backdrop-filter: blur(12px);
        }
        .btn-img:hover:not(:disabled) { background: rgba(255,255,255,0.16); color: white; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  )
}
