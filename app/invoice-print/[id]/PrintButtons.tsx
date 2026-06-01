'use client'

import { useState } from 'react'

interface Props { invoiceId: string }

export default function PrintButtons({ invoiceId }: Props) {
  const [enhancing, setEnhancing] = useState(false)
  const [enhanced, setEnhanced]   = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  async function handleDownload() {
    setDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element  = document.querySelector('.invoice') as HTMLElement
      if (!element) return

      const opt = {
        margin:      0,
        filename:    `factura-${invoiceId}.pdf`,
        image:       { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
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
        ${items ? `
        <ul style="margin:0 0 10px 0;padding-left:16px;color:#334155;font-size:12px;line-height:1.6;">
          ${items}
        </ul>` : ''}
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          ${s.periodo ? `<span style="font-size:10.5px;color:#94a3b8;font-weight:500;">${esc(s.periodo)}</span>` : ''}
          ${s.nota ? `<span style="font-size:10.5px;color:#94a3b8;font-style:italic;">${esc(s.nota)}</span>` : ''}
        </div>
      </div>`
  }

  return (
    <div className="no-print">
      <button onClick={() => window.history.back()} className="btn-back">
        ← Volver
      </button>
      <button onClick={handleEnhance} disabled={enhancing || enhanced} className="btn-enhance">
        {enhancing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg style={{ animation: 'spin .8s linear infinite', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Mejorando...
          </span>
        ) : enhanced ? '✓ Mejorado con IA' : '✦ Mejorar con IA'}
      </button>
      <button onClick={() => window.print()} className="btn-print">
        Imprimir
      </button>
      <button onClick={handleDownload} disabled={downloading} className="btn-download">
        {downloading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg style={{ animation: 'spin .8s linear infinite', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Generando...
          </span>
        ) : '↓ Descargar PDF'}
      </button>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-print {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; gap: 10px; z-index: 100;
        }
        .btn-back {
          padding: 11px 20px; border-radius: 12px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s;
        }
        .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
        .btn-enhance {
          padding: 11px 20px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: 1px solid rgba(167,139,250,0.35);
          background: rgba(167,139,250,0.1); color: rgba(196,181,253,0.9);
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s; min-width: 160px; text-align: center;
        }
        .btn-enhance:hover:not(:disabled) { background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.5); }
        .btn-enhance:disabled { opacity: .6; cursor: not-allowed; }
        .btn-print {
          padding: 11px 22px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: 1px solid rgba(249,115,22,0.3);
          background: rgba(249,115,22,0.1); color: #fb923c;
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(12px); transition: all .15s;
        }
        .btn-print:hover { background: rgba(249,115,22,0.18); border-color: rgba(249,115,22,0.5); }
        .btn-download {
          padding: 11px 22px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: none;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(249,115,22,0.35);
          transition: all .15s; min-width: 150px; text-align: center;
        }
        .btn-download:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .btn-download:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  )
}
