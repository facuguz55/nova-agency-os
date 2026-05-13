import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintButtons from './PrintButtons'

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, clients(name, email, industry, contact_person)')
    .eq('id', id)
    .single()

  if (!inv) notFound()

  const client = inv.clients as { name: string; email: string | null; industry: string | null; contact_person: string | null } | null
  const issued = new Date(inv.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const due    = inv.due_date ? new Date(inv.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : null
  const paid   = inv.paid_at  ? new Date(inv.paid_at).toLocaleDateString('es-AR',  { day: '2-digit', month: 'long', year: 'numeric' }) : null
  const amount = Number(inv.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })

  const statusLabel: Record<string, string> = {
    draft: 'BORRADOR', pending: 'PENDIENTE', paid: 'PAGADA', overdue: 'VENCIDA', canceled: 'CANCELADA',
  }
  const statusColor: Record<string, { bg: string; text: string; ring: string }> = {
    draft:    { bg: 'rgba(100,116,139,0.1)',  text: '#94a3b8', ring: 'rgba(100,116,139,0.2)' },
    pending:  { bg: 'rgba(249,115,22,0.1)',   text: '#f97316', ring: 'rgba(249,115,22,0.2)' },
    paid:     { bg: 'rgba(34,197,94,0.1)',    text: '#22c55e', ring: 'rgba(34,197,94,0.2)' },
    overdue:  { bg: 'rgba(239,68,68,0.1)',    text: '#ef4444', ring: 'rgba(239,68,68,0.2)' },
    canceled: { bg: 'rgba(148,163,184,0.08)', text: '#64748b', ring: 'rgba(148,163,184,0.15)' },
  }
  const sc = statusColor[inv.status] || statusColor.draft

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(160deg, #030810 0%, #08152a 50%, #060f1e 100%);
          min-height: 100vh;
          color: #1e293b;
        }

        .wrapper {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 48px 20px;
          min-height: 100vh;
        }

        .invoice {
          background: white;
          width: 760px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 48px 96px rgba(0,0,0,0.7), 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04);
        }

        /* Header dark */
        .inv-header {
          background: #060d18;
          padding: 40px 48px 36px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .inv-header::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
        }

        .agency-logo { width: 56px; height: 56px; object-fit: contain; }

        .inv-number-area { text-align: right; }
        .inv-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .12em; color: rgba(255,255,255,0.3); margin-bottom: 6px;
        }
        .inv-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px; font-weight: 700;
          color: white; letter-spacing: -1px; line-height: 1;
        }
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 10px; padding: 5px 12px; border-radius: 99px;
          font-size: 10px; font-weight: 700; letter-spacing: .08em;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* Accent line */
        .accent-line {
          height: 3px;
          background: linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%);
        }

        /* Body */
        .inv-body { padding: 40px 48px; }

        .billing-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 40px; margin-bottom: 36px;
        }
        .field-label {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px;
        }
        .field-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600; color: #0f172a; line-height: 1.2;
        }
        .field-sub { font-size: 12px; color: #64748b; margin-top: 3px; }

        .dates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .date-item {}
        .date-value { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 3px; }
        .date-value-green { color: #16a34a; }
        .date-value-red { color: #dc2626; }

        .divider { border: none; border-top: 1px solid #f1f5f9; margin: 28px 0; }

        /* Table */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .items-table thead tr { border-bottom: 2px solid #f1f5f9; }
        .th { padding: 8px 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; }
        .th-r { text-align: right; }
        .td { padding: 16px 0; font-size: 13px; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: top; }
        .td-r { text-align: right; font-weight: 600; color: #1e293b; }

        /* Total */
        .total-box {
          display: flex; justify-content: flex-end;
        }
        .total-inner {
          text-align: right; padding: 20px 28px; border-radius: 16px;
          background: #fff7ed; border: 1px solid #fed7aa; min-width: 220px;
        }
        .total-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #d97706; margin-bottom: 6px; }
        .total-amount {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px; font-weight: 700; color: #f97316; letter-spacing: -1px;
          line-height: 1;
        }

        /* Footer */
        .inv-footer {
          background: #060d18;
          padding: 20px 48px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-text { font-size: 10px; color: rgba(255,255,255,0.25); }
        .footer-ig { font-size: 10px; color: rgba(249,115,22,0.5); margin-top: 2px; }

        /* Buttons */
        .no-print {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; gap: 10px; z-index: 100;
        }

        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .wrapper { padding: 0; }
          .invoice { box-shadow: none; border-radius: 0; width: 100%; }
          .inv-header { background: #060d18 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .inv-footer { background: #060d18 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        @page { margin: 0; size: A4 portrait; }
      `}</style>

      <div className="wrapper">
        <div className="invoice">

          {/* Header */}
          <div className="inv-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nova-clear.png" alt="Nova Agency" className="agency-logo" />
            <div className="inv-number-area">
              <p className="inv-label">Factura</p>
              <p className="inv-number">{inv.invoice_number}</p>
              <div
                className="status-badge"
                style={{ background: sc.bg, color: sc.text, boxShadow: `0 0 0 1px ${sc.ring}` }}
              >
                <span className="status-dot" />
                {statusLabel[inv.status] || inv.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="accent-line" />

          {/* Body */}
          <div className="inv-body">
            <div className="billing-grid">
              <div>
                <p className="field-label">Facturado a</p>
                <p className="field-name">{client?.name || '—'}</p>
                {client?.contact_person && <p className="field-sub">{client.contact_person}</p>}
                {client?.email && <p className="field-sub">{client.email}</p>}
                {client?.industry && <p className="field-sub" style={{ color: '#94a3b8' }}>{client.industry}</p>}
              </div>
              <div className="dates-grid">
                <div>
                  <p className="field-label">Emisión</p>
                  <p className="date-value">{issued}</p>
                </div>
                {due && (
                  <div>
                    <p className="field-label">Vencimiento</p>
                    <p className={`date-value ${inv.status === 'overdue' ? 'date-value-red' : ''}`}>{due}</p>
                  </div>
                )}
                {paid && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="field-label">Fecha de pago</p>
                    <p className="date-value date-value-green">{paid}</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="divider" />

            {/* Tabla */}
            <table className="items-table">
              <thead>
                <tr>
                  <th className="th" style={{ textAlign: 'left' }}>Descripción</th>
                  <th className="th th-r">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td" id="invoice-description">{inv.description || 'Servicios profesionales'}</td>
                  <td className="td td-r">ARS $ {amount}</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="total-box">
              <div className="total-inner">
                <p className="total-label">Total ARS</p>
                <p className="total-amount">$ {amount}</p>
              </div>
            </div>
          </div>

          <hr className="divider" style={{ margin: '0 48px' }} />

          {/* Footer */}
          <div className="inv-footer">
            <div>
              <p className="footer-text">Nova Agency · Agencia Digital</p>
              <p className="footer-ig">@novaagencytec</p>
            </div>
            <p className="footer-text">Generado el {new Date().toLocaleDateString('es-AR')}</p>
          </div>

        </div>
      </div>

      <PrintButtons invoiceId={id} />
    </>
  )
}
