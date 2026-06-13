import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintButtons from './PrintButtons'
import { COMPANY, COMPROBANTE_CODIGO, formatComprobanteNumero } from '@/lib/company'

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, clients(name, legal_name, email, industry, contact_person, tax_id, tax_condition, fiscal_address)')
    .eq('id', id)
    .single()

  if (!inv) notFound()

  const client = inv.clients as {
    name: string; legal_name: string | null; email: string | null; industry: string | null
    contact_person: string | null; tax_id: string | null; tax_condition: string | null; fiscal_address: string | null
  } | null

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const fmtMoney = (n: number) =>
    Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const tipo    = inv.comprobante_tipo || 'C'
  const codigo  = COMPROBANTE_CODIGO[tipo] || '11'
  const numero  = formatComprobanteNumero(inv.invoice_number, inv.punto_venta)
  const issued  = fmtDate(inv.created_at)
  const due     = inv.due_date ? fmtDate(inv.due_date) : null
  const paid    = inv.paid_at  ? fmtDate(inv.paid_at)  : null
  const total   = Number(inv.amount)
  const caeVto  = inv.cae_vto ? fmtDate(inv.cae_vto) : null

  const recName = client?.legal_name || client?.name || '—'
  const recCond = client?.tax_condition || 'Consumidor Final'

  const statusLabel: Record<string, string> = {
    draft: 'Borrador', pending: 'Pendiente', paid: 'Pagada', partial: 'Pago parcial', overdue: 'Vencida', canceled: 'Anulada',
  }
  const statusDot: Record<string, string> = {
    draft: '#9ca3af', pending: '#f59e0b', partial: '#f59e0b', paid: '#16a34a', overdue: '#dc2626', canceled: '#9ca3af',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #ebebed;
          min-height: 100vh;
          color: #0a0a0a;
          -webkit-font-smoothing: antialiased;
          font-variant-numeric: tabular-nums;
        }

        .page { display: flex; justify-content: center; align-items: flex-start; padding: 48px 20px; min-height: 100vh; }

        .sheet {
          background: #ffffff;
          width: 720px;
          min-height: 1018px;
          padding: 64px 64px 48px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 18px 60px rgba(0,0,0,0.10);
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .head { display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { display: flex; align-items: center; gap: 13px; }
        .logo { width: 44px; height: 44px; object-fit: contain; border-radius: 11px; }
        .brand-name { font-size: 19px; font-weight: 700; letter-spacing: -.3px; color: #0a0a0a; line-height: 1; }
        .brand-tag { font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: #9ca3af; margin-top: 5px; }

        .doc { text-align: right; }
        .doc-letter { font-size: 50px; font-weight: 300; line-height: .9; color: #f59e0b; letter-spacing: 1px; }
        .doc-type { font-size: 9.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #9ca3af; margin-top: 4px; }
        .doc-num { font-size: 16px; font-weight: 700; color: #0a0a0a; margin-top: 7px; letter-spacing: .02em; }
        .doc-status { font-size: 11px; font-weight: 600; margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

        .rule { border: none; border-top: 1px solid #ededed; }

        /* ── Partes ── */
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; }
        .label { font-size: 9.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #9ca3af; margin-bottom: 11px; }
        .party-name { font-size: 17px; font-weight: 600; color: #0a0a0a; line-height: 1.25; }
        .party-line { font-size: 12.5px; font-weight: 400; color: #6b7280; line-height: 1.7; }
        .party-line strong { color: #1a1a1a; font-weight: 600; }

        /* ── Meta ── */
        .meta { display: flex; gap: 56px; margin-top: 40px; }
        .meta-val { font-size: 13px; font-weight: 600; color: #1a1a1a; }
        .meta-val.red { color: #dc2626; }
        .meta-val.green { color: #16a34a; }

        /* ── Items ── */
        .items { margin-top: 44px; }
        .items-head, .item-row {
          display: grid; grid-template-columns: 1fr 70px 150px; gap: 16px; align-items: baseline;
        }
        .items-head { padding-bottom: 12px; border-bottom: 1px solid #0a0a0a; }
        .items-head span { font-size: 9.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #9ca3af; }
        .items-head .r, .item-row .r { text-align: right; }
        .item-row { padding: 18px 0; border-bottom: 1px solid #ededed; }
        .item-desc { font-size: 13.5px; font-weight: 500; color: #1a1a1a; line-height: 1.5; }
        .item-cant { font-size: 13px; color: #6b7280; }
        .item-imp { font-size: 14px; font-weight: 600; color: #0a0a0a; }

        /* ── Totales ── */
        .totals { margin-top: 28px; display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }
        .tot-line { display: flex; justify-content: space-between; width: 280px; font-size: 13px; }
        .tot-line .k { color: #9ca3af; }
        .tot-line .v { color: #1a1a1a; font-weight: 500; }
        .tot-grand { display: flex; justify-content: space-between; align-items: baseline; width: 280px; margin-top: 12px; padding-top: 16px; border-top: 2px solid #0a0a0a; }
        .tot-grand .k { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #6b7280; }
        .grand-amt { font-size: 34px; font-weight: 700; letter-spacing: -1px; color: #0a0a0a; line-height: 1; }

        /* ── Pie ── */
        .foot { margin-top: auto; padding-top: 48px; }
        .cae-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding-bottom: 16px; }
        .cae-num { font-size: 13px; font-weight: 700; color: #0a0a0a; letter-spacing: .03em; }
        .cae-vto { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .cae-pending { font-size: 11px; color: #cbd5e1; font-style: italic; }
        .legend { font-size: 10px; color: #9ca3af; line-height: 1.6; max-width: 62%; }
        .sign { margin-top: 16px; padding-top: 16px; border-top: 1px solid #ededed; display: flex; justify-content: space-between; font-size: 10px; color: #b8b8b8; }
        .sign .amber { color: #d9a441; font-weight: 600; }

        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 0; }
          .sheet { box-shadow: none; width: 100%; }
        }
        @page { margin: 0; size: A4 portrait; }
      `}</style>

      <div className="page">
        <div className="sheet">

          {/* Header */}
          <div className="head">
            <div className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-nova-dark.png" alt="Nova Agency" className="logo" />
              <div>
                <div className="brand-name">{COMPANY.tradeName}</div>
                <div className="brand-tag">Agencia Digital</div>
              </div>
            </div>
            <div className="doc">
              <div className="doc-letter">{tipo}</div>
              <div className="doc-type">Factura · Cód. {codigo}</div>
              <div className="doc-num">{numero}</div>
              <div className="doc-status" style={{ color: statusDot[inv.status] || '#9ca3af' }}>
                <span className="dot" style={{ background: statusDot[inv.status] || '#9ca3af' }} />
                {statusLabel[inv.status] || inv.status}
              </div>
            </div>
          </div>

          {/* Partes */}
          <div className="parties">
            <div>
              <div className="label">Facturado a</div>
              <div className="party-name">{recName}</div>
              {client?.contact_person && <div className="party-line">{client.contact_person}</div>}
              <div className="party-line">CUIT/DNI: <strong>{client?.tax_id || '—'}</strong></div>
              <div className="party-line">{recCond}</div>
              {client?.fiscal_address && <div className="party-line">{client.fiscal_address}</div>}
            </div>
            <div>
              <div className="label">Emitido por</div>
              <div className="party-name">{COMPANY.legalName}</div>
              <div className="party-line">{COMPANY.tradeName}</div>
              <div className="party-line">CUIT: <strong>{COMPANY.cuit}</strong></div>
              <div className="party-line">{COMPANY.taxCondition}</div>
              <div className="party-line">{COMPANY.address} · {COMPANY.city}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="meta">
            <div>
              <div className="label">Emisión</div>
              <div className="meta-val">{issued}</div>
            </div>
            {due && (
              <div>
                <div className="label">Vencimiento</div>
                <div className={`meta-val ${inv.status === 'overdue' ? 'red' : ''}`}>{due}</div>
              </div>
            )}
            <div>
              <div className="label">Condición de venta</div>
              <div className="meta-val">{paid ? 'Contado' : 'Cuenta corriente'}</div>
            </div>
            {paid && (
              <div>
                <div className="label">Pago</div>
                <div className="meta-val green">{paid}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="items">
            <div className="items-head">
              <span>Descripción</span>
              <span className="r">Cant.</span>
              <span className="r">Importe</span>
            </div>
            <div className="item-row">
              <div className="item-desc" id="invoice-description">{inv.description || 'Servicios profesionales'}</div>
              <div className="item-cant r">1</div>
              <div className="item-imp r">$ {fmtMoney(total)}</div>
            </div>
          </div>

          {/* Totales */}
          <div className="totals">
            <div className="tot-line"><span className="k">Subtotal</span><span className="v">$ {fmtMoney(total)}</span></div>
            <div className="tot-line"><span className="k">Otros tributos</span><span className="v">$ 0,00</span></div>
            <div className="tot-grand">
              <span className="k">Total ARS</span>
              <span className="grand-amt">$ {fmtMoney(total)}</span>
            </div>
          </div>

          {/* Pie */}
          <div className="foot">
            <div className="cae-row">
              <div className="legend">
                Comprobante tipo {tipo} · Régimen de Monotributo. El monto no discrimina IVA.
                {tipo === 'X' && ' Documento sin valor fiscal.'}
              </div>
              <div style={{ textAlign: 'right' }}>
                {inv.cae ? (
                  <>
                    <div className="label" style={{ marginBottom: 4 }}>CAE</div>
                    <div className="cae-num">{inv.cae}</div>
                    {caeVto && <div className="cae-vto">Vto. {caeVto}</div>}
                  </>
                ) : (
                  <span className="cae-pending">Sin CAE asignado</span>
                )}
              </div>
            </div>
            <div className="sign">
              <span>{COMPANY.tradeName} · {COMPANY.website} · <span className="amber">{COMPANY.instagram}</span></span>
              <span>Generado el {new Date().toLocaleDateString('es-AR')}</span>
            </div>
          </div>

        </div>
      </div>

      <PrintButtons invoiceId={id} />
    </>
  )
}
