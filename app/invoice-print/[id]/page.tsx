import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

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
    draft: 'BORRADOR', pending: 'PENDIENTE DE PAGO', paid: 'PAGADA', overdue: 'VENCIDA', canceled: 'CANCELADA',
  }
  const statusColor: Record<string, string> = {
    draft: '#64748b', pending: '#f97316', paid: '#22c55e', overdue: '#ef4444', canceled: '#94a3b8',
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
        .invoice-page { background: white; max-width: 800px; margin: 40px auto; padding: 56px; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 12px; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
        .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; }
        .value { font-size: 14px; color: #1e293b; margin-top: 4px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
        .amount-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px 28px; }
        .no-print { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 12px; }
        .btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { background: #f97316; color: white; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        @media print {
          body { background: white; }
          .invoice-page { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="invoice-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nova.png" alt="Nova Agency" style={{ height: 52, marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Nova Agency<br/>
              Buenos Aires, Argentina<br/>
              hello@novaagency.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94a3b8', marginBottom: 6 }}>Factura</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-.5px' }}>{inv.invoice_number}</p>
            <span style={{
              display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 99,
              background: `${statusColor[inv.status]}20`, color: statusColor[inv.status],
              fontSize: 10, fontWeight: 700, letterSpacing: '.06em',
            }}>
              {statusLabel[inv.status] || inv.status.toUpperCase()}
            </span>
          </div>
        </div>

        <hr className="divider" />

        {/* Billing to + dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
          <div>
            <p className="label">Facturado a</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>{client?.name || '—'}</p>
            {client?.contact_person && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{client.contact_person}</p>}
            {client?.email && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{client.email}</p>}
            {client?.industry && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{client.industry}</p>}
          </div>
          <div className="meta-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <p className="label">Fecha de emisión</p>
              <p className="value">{issued}</p>
            </div>
            {due && (
              <div>
                <p className="label">Vencimiento</p>
                <p className="value" style={{ color: inv.status === 'overdue' ? '#ef4444' : undefined }}>{due}</p>
              </div>
            )}
            {paid && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="label">Fecha de pago</p>
                <p className="value" style={{ color: '#22c55e' }}>{paid}</p>
              </div>
            )}
          </div>
        </div>

        <hr className="divider" />

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8' }}>Descripción</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f8fafc' }}>
                {inv.description || 'Servicios profesionales'}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f8fafc' }}>
                $ {amount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="amount-box">
            <p className="label" style={{ marginBottom: 6 }}>Total ARS</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#f97316', letterSpacing: '-.5px' }}>
              $ {amount}
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: '#cbd5e1' }}>Nova Agency · hello@novaagency.com</p>
          <p style={{ fontSize: 11, color: '#cbd5e1' }}>Generado el {new Date().toLocaleDateString('es-AR')}</p>
        </div>
      </div>

      {/* Botones (no se imprimen) */}
      <div className="no-print">
        <button className="btn btn-secondary" onClick={() => window.history.back()}>← Volver</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelector('.btn-secondary').addEventListener('click', () => window.history.back());
        document.querySelector('.btn-primary').addEventListener('click', () => window.print());
      `}} />
    </>
  )
}
