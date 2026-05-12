'use client'

import { useState } from 'react'

interface Props { invoiceId: string }

export default function PrintButtons({ invoiceId }: Props) {
  const [enhancing, setEnhancing] = useState(false)
  const [enhanced, setEnhanced]   = useState(false)

  async function handlePrint() {
    if (!enhanced) {
      setEnhancing(true)
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/enhance`, { method: 'POST' })
        if (res.ok) {
          const { enhanced: text } = await res.json()
          const el = document.getElementById('invoice-description')
          if (el && text) {
            el.textContent = text
            setEnhanced(true)
          }
        }
      } catch {
        // imprime igual si falla el enhance
      }
      setEnhancing(false)
    }
    window.print()
  }

  return (
    <div className="no-print">
      <button onClick={() => window.history.back()} className="btn-back">
        ← Volver
      </button>
      <button onClick={handlePrint} disabled={enhancing} className="btn-print">
        {enhancing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg style={{ animation: 'spin .8s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Mejorando con IA...
          </span>
        ) : enhanced ? 'Imprimir / PDF' : 'IA + PDF'}
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
        .btn-print {
          padding: 11px 22px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: none;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(249,115,22,0.35);
          transition: all .15s; min-width: 140px; text-align: center;
        }
        .btn-print:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
        .btn-print:disabled { opacity: .7; cursor: not-allowed; transform: none; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  )
}
