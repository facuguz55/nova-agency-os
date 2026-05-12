'use client'

export default function PrintButtons() {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', gap: 12 }} className="no-print">
      <button
        onClick={() => window.history.back()}
        style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f1f5f9', color: '#475569' }}
      >
        ← Volver
      </button>
      <button
        onClick={() => window.print()}
        style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f97316', color: 'white' }}
      >
        Imprimir / PDF
      </button>
    </div>
  )
}
