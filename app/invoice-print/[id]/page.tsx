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
  const statusColor: Record<string, string> = {
    draft: '#94a3b8', pending: '#ff8a3d', partial: '#ff8a3d', paid: '#3ddc84', overdue: '#ff5a5a', canceled: '#94a3b8',
  }
  const stColor = statusColor[inv.status] || '#94a3b8'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(155deg, #0B1F3A 0%, #071427 55%, #0A0A0A 100%);
          min-height: 100vh;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
          font-variant-numeric: tabular-nums;
        }
        .display { font-family: 'Syne', sans-serif; }

        .page { display: flex; justify-content: center; align-items: flex-start; padding: 48px 20px; min-height: 100vh; }

        .sheet {
          background: #ffffff;
          width: 720px;
          min-height: 1018px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.18), 0 30px 80px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
        }

        /* ── Header de marca ── */
        .head {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0B1F3A 0%, #0a1830 50%, #060d18 100%);
          padding: 38px 56px 34px;
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .head::before {
          content: ''; position: absolute; top: -90px; right: -40px;
          width: 320px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,106,0,0.28) 0%, rgba(255,106,0,0) 70%);
        }
        .head::after {
          content: ''; position: absolute; bottom: -120px; left: -60px;
          width: 280px; height: 240px; border-radius: 50%;
          background: radial-gradient(circle, rgba(45,156,219,0.18) 0%, rgba(45,156,219,0) 70%);
        }
        .brand { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
        .logo { width: 52px; height: 52px; object-fit: contain; border-radius: 13px; }
        .brand-name { font-size: 24px; font-weight: 800; letter-spacing: -.5px; color: #fff; line-height: 1; }
        .brand-tag { font-size: 10px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: #ff8a3d; margin-top: 6px; }

        .doc { text-align: right; position: relative; z-index: 1; }
        .doc-letter { font-size: 56px; font-weight: 800; line-height: .85; color: #ff6a00; text-shadow: 0 0 24px rgba(255,106,0,0.45); }
        .doc-type { font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-top: 6px; }
        .doc-num { font-size: 16px; font-weight: 700; color: #fff; margin-top: 6px; letter-spacing: .04em; }
        .doc-status { font-size: 11px; font-weight: 700; margin-top: 9px; display: inline-flex; align-items: center; gap: 6px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

        .accent { height: 4px; background: linear-gradient(90deg, #ff6a00 0%, #ff8a3d 45%, #2d9cdb 100%); }

        /* ── Cuerpo ── */
        .body { padding: 40px 56px 0; flex: 1; }

        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
        .label { font-size: 9.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #ff6a00; margin-bottom: 11px; }
        .party-name { font-size: 17px; font-weight: 700; color: #0f172a; line-height: 1.25; font-family: 'Syne', sans-serif; }
        .party-line { font-size: 12.5px; font-weight: 400; color: #64748b; line-height: 1.7; }
        .party-line strong { color: #1e293b; font-weight: 600; }

        .meta { display: flex; gap: 52px; margin-top: 34px; padding: 18px 0; border-top: 1px solid #eef2f7; border-bottom: 1px solid #eef2f7; }
        .meta .label { color: #94a3b8; margin-bottom: 7px; }
        .meta-val { font-size: 13px; font-weight: 600; color: #1e293b; }
        .meta-val.red { color: #dc2626; }
        .meta-val.green { color: #16a34a; }

        /* ── Items ── */
        .items { margin-top: 34px; }
        .items-head, .item-row { display: grid; grid-template-columns: 1fr 70px 150px; gap: 16px; align-items: baseline; }
        .items-head { padding: 0 0 12px; }
        .items-head span { font-size: 9.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #94a3b8; }
        .r { text-align: right; }
        .item-row { padding: 18px 0; border-top: 1px solid #0f172a; }
        .item-desc { font-size: 13.5px; font-weight: 500; color: #1e293b; line-height: 1.5; }
        .item-cant { font-size: 13px; color: #64748b; }
        .item-imp { font-size: 14px; font-weight: 600; color: #0f172a; }

        /* ── Totales ── */
        .totals { margin-top: 26px; display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }
        .tot-line { display: flex; justify-content: space-between; width: 340px; font-size: 13px; }
        .tot-line .k { color: #94a3b8; }
        .tot-line .v { color: #1e293b; font-weight: 500; }
        .tot-grand {
          display: flex; flex-direction: column; align-items: flex-start; gap: 7px; width: 340px; margin-top: 12px;
          padding: 18px 22px; border-radius: 14px;
          background: linear-gradient(135deg, #0B1F3A 0%, #060d18 100%);
        }
        .tot-grand .k { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .grand-amt { font-size: 27px; font-weight: 800; letter-spacing: -.3px; color: #ff8a3d; line-height: 1.05; font-family: 'Syne', sans-serif; white-space: nowrap; }

        /* ── Pie ── */
        .foot { margin-top: 36px; padding: 22px 0 30px; }
        .cae-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
        .cae-num { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: .03em; }
        .cae-vto { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .cae-pending { font-size: 11px; color: #cbd5e1; font-style: italic; }
        .legend { font-size: 10px; color: #94a3b8; line-height: 1.6; max-width: 60%; }

        .signbar {
          background: linear-gradient(135deg, #0B1F3A 0%, #060d18 100%);
          padding: 16px 56px; display: flex; justify-content: space-between; align-items: center;
        }
        .signbar .l { font-size: 11px; color: rgba(255,255,255,0.55); }
        .signbar .ig { color: #ff8a3d; font-weight: 600; }
        .signbar .r { font-size: 10px; color: rgba(255,255,255,0.35); }

        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 0; }
          .sheet { box-shadow: none; width: 100%; }
          .head, .accent, .tot-grand, .signbar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { margin: 0; size: A4 portrait; }
      `}</style>

      <div className="page">
        <div className="sheet">

          {/* Header de marca */}
          <div className="head">
            <div className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-nova-dark.png" alt="Nova Agency" className="logo" />
              <div>
                <div className="brand-name display">{COMPANY.tradeName}</div>
                <div className="brand-tag">Agencia Digital</div>
              </div>
            </div>
            <div className="doc">
              <div className="doc-letter display">{tipo}</div>
              <div className="doc-type">Factura · Cód. {codigo}</div>
              <div className="doc-num">{numero}</div>
              <div className="doc-status" style={{ color: stColor }}>
                <span className="dot" style={{ background: stColor }} />
                {statusLabel[inv.status] || inv.status}
              </div>
            </div>
          </div>

          <div className="accent" />

          {/* Cuerpo */}
          <div className="body">
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

            <div className="totals">
              <div className="tot-line"><span className="k">Subtotal</span><span className="v">$ {fmtMoney(total)}</span></div>
              <div className="tot-line"><span className="k">Otros tributos</span><span className="v">$ 0,00</span></div>
              <div className="tot-grand">
                <span className="k">Total ARS</span>
                <span className="grand-amt display">$ {fmtMoney(total)}</span>
              </div>
            </div>

            <div className="foot">
              <div className="cae-row">
                <div className="legend">
                  Comprobante tipo {tipo} · Régimen de Monotributo. El monto no discrimina IVA.
                  {tipo === 'X' && ' Documento sin valor fiscal.'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {inv.cae ? (
                    <>
                      <div className="label" style={{ color: '#94a3b8', marginBottom: 4 }}>CAE</div>
                      <div className="cae-num">{inv.cae}</div>
                      {caeVto && <div className="cae-vto">Vto. {caeVto}</div>}
                    </>
                  ) : (
                    <span className="cae-pending">Sin CAE asignado</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de firma / marca */}
          <div className="signbar">
            <span className="l">{COMPANY.tradeName} · {COMPANY.website} · <span className="ig">{COMPANY.instagram}</span></span>
            <span className="r">Generado el {new Date().toLocaleDateString('es-AR')}</span>
          </div>

        </div>
      </div>

      <PrintButtons invoiceId={id} />
    </>
  )
}
