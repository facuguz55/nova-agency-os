import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintButtons from './PrintButtons'
import { COMPANY, COMPROBANTE_LABEL, COMPROBANTE_CODIGO, formatComprobanteNumero } from '@/lib/company'

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

  const tipo        = inv.comprobante_tipo || 'C'
  const comprobante = COMPROBANTE_LABEL[tipo] || 'FACTURA C'
  const codigo      = COMPROBANTE_CODIGO[tipo] || '11'
  const numero      = formatComprobanteNumero(inv.invoice_number, inv.punto_venta)
  const issued      = fmtDate(inv.created_at)
  const due         = inv.due_date ? fmtDate(inv.due_date) : null
  const paid        = inv.paid_at  ? fmtDate(inv.paid_at)  : null
  const total       = Number(inv.amount)
  const caeVto      = inv.cae_vto ? fmtDate(inv.cae_vto) : null

  const recName = client?.legal_name || client?.name || '—'
  const recCond = client?.tax_condition || 'Consumidor Final'

  const statusLabel: Record<string, string> = {
    draft: 'BORRADOR', pending: 'PENDIENTE', paid: 'PAGADA', partial: 'PAGO PARCIAL', overdue: 'VENCIDA', canceled: 'ANULADA',
  }
  const statusColor: Record<string, { bg: string; text: string; ring: string }> = {
    draft:    { bg: 'rgba(100,116,139,0.10)', text: '#64748b', ring: 'rgba(100,116,139,0.25)' },
    pending:  { bg: 'rgba(245,158,11,0.10)',  text: '#b45309', ring: 'rgba(245,158,11,0.30)' },
    partial:  { bg: 'rgba(245,158,11,0.10)',  text: '#b45309', ring: 'rgba(245,158,11,0.30)' },
    paid:     { bg: 'rgba(22,163,74,0.10)',   text: '#15803d', ring: 'rgba(22,163,74,0.30)' },
    overdue:  { bg: 'rgba(220,38,38,0.10)',   text: '#dc2626', ring: 'rgba(220,38,38,0.30)' },
    canceled: { bg: 'rgba(100,116,139,0.10)', text: '#64748b', ring: 'rgba(100,116,139,0.25)' },
  }
  const sc = statusColor[inv.status] || statusColor.draft

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(160deg, #030810 0%, #08152a 50%, #060f1e 100%);
          min-height: 100vh;
          color: #1e293b;
          -webkit-font-smoothing: antialiased;
        }

        .wrapper { display: flex; justify-content: center; align-items: flex-start; padding: 48px 20px; min-height: 100vh; }

        .invoice {
          background: #ffffff;
          width: 720px;
          min-height: 1018px;
          overflow: hidden;
          box-shadow: 0 48px 96px rgba(0,0,0,0.7), 0 12px 32px rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* ── Banda superior: ORIGINAL ── */
        .doc-top { display: flex; justify-content: space-between; align-items: center; padding: 10px 40px; background: #0b1220; }
        .doc-top .copy { font-size: 9px; font-weight: 700; letter-spacing: .22em; color: rgba(255,255,255,0.45); text-transform: uppercase; }
        .doc-top .status-badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 99px;
          font-size: 9px; font-weight: 800; letter-spacing: .08em;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* ── Header fiscal: emisor | letra | comprobante ── */
        .fiscal-head { display: grid; grid-template-columns: 1fr 96px 1fr; align-items: stretch; border-bottom: 2px solid #0f172a; }
        .emisor { padding: 26px 28px 22px 40px; }
        .comp   { padding: 26px 40px 22px 28px; text-align: right; }

        .brand-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .agency-logo { width: 46px; height: 46px; object-fit: contain; border-radius: 11px; }
        .brand-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #0f172a; line-height: 1; letter-spacing: -.5px; }
        .brand-tag  { font-size: 9px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: #f59e0b; margin-top: 3px; }

        .em-line { font-size: 11px; color: #475569; line-height: 1.55; }
        .em-line strong { color: #1e293b; font-weight: 600; }

        /* Recuadro de la letra C (estilo AFIP) */
        .letter-box {
          align-self: stretch; display: flex; flex-direction: column; align-items: center; justify-content: center;
          border-left: 2px solid #0f172a; border-right: 2px solid #0f172a; background: #fafafa;
        }
        .letter { font-family: 'Cormorant Garamond', serif; font-size: 54px; font-weight: 700; color: #0f172a; line-height: .9; }
        .letter-cod { font-size: 8px; font-weight: 700; letter-spacing: .1em; color: #64748b; margin-top: 2px; }

        .comp-title { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 700; color: #0f172a; letter-spacing: -.5px; line-height: 1; }
        .comp-grid { margin-top: 14px; font-size: 11px; color: #475569; line-height: 1.7; }
        .comp-grid .k { color: #94a3b8; font-weight: 600; }
        .comp-grid .v { color: #1e293b; font-weight: 600; }
        .comp-num { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: .02em; }

        /* ── Receptor ── */
        .receptor { padding: 18px 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .rec-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px 32px; }
        .field { font-size: 11px; line-height: 1.5; }
        .field .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
        .field .val { font-size: 12.5px; color: #0f172a; font-weight: 600; }

        /* ── Cuerpo / tabla ── */
        .inv-body { padding: 22px 40px 0; flex: 1; }
        .meta-row { display: flex; gap: 28px; margin-bottom: 18px; }
        .meta-item .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
        .meta-item .val { font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 2px; }
        .meta-item .val.red { color: #dc2626; }
        .meta-item .val.green { color: #16a34a; }

        .items-table { width: 100%; border-collapse: collapse; }
        .items-table thead tr { background: #0b1220; }
        .th { padding: 10px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,0.85); text-align: left; }
        .th-r { text-align: right; }
        .td { padding: 15px 12px; font-size: 12.5px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .td-r { text-align: right; font-weight: 600; color: #1e293b; white-space: nowrap; }
        .td-desc { font-weight: 500; color: #1e293b; }

        /* ── Totales ── */
        .totals { display: flex; justify-content: flex-end; padding: 20px 0 8px; }
        .totals-inner { width: 280px; }
        .tot-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #475569; }
        .tot-row .v { font-weight: 600; color: #1e293b; }
        .tot-total {
          display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;
          padding: 14px 18px; border-radius: 14px; background: #fff7ed; border: 1px solid #fed7aa;
        }
        .tot-total .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #b45309; }
        .tot-total .amt { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: #f59e0b; letter-spacing: -.5px; line-height: 1; }

        /* ── Pie / CAE ── */
        .cae-zone { margin: 14px 40px 0; padding: 14px 0; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
        .legend { font-size: 9.5px; color: #94a3b8; line-height: 1.5; max-width: 60%; }
        .legend strong { color: #64748b; font-weight: 700; }
        .cae-box { text-align: right; }
        .cae-box .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
        .cae-box .num { font-size: 14px; font-weight: 800; color: #0f172a; letter-spacing: .03em; }
        .cae-box .vto { font-size: 10px; color: #64748b; margin-top: 2px; }
        .cae-pending { font-size: 10px; color: #cbd5e1; font-style: italic; }

        .inv-footer { background: #0b1220; padding: 16px 40px; display: flex; align-items: center; justify-content: space-between; margin-top: 18px; }
        .footer-text { font-size: 10px; color: rgba(255,255,255,0.4); }
        .footer-amber { font-size: 10px; color: #f59e0b; margin-top: 2px; font-weight: 600; }

        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .wrapper { padding: 0; }
          .invoice { box-shadow: none; width: 100%; }
          .doc-top, .items-table thead tr, .inv-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        @page { margin: 0; size: A4 portrait; }
      `}</style>

      <div className="wrapper">
        <div className="invoice">

          {/* Banda superior */}
          <div className="doc-top">
            <span className="copy">Original</span>
            <span className="status-badge" style={{ background: sc.bg, color: sc.text, boxShadow: `0 0 0 1px ${sc.ring}` }}>
              <span className="status-dot" />{statusLabel[inv.status] || inv.status?.toUpperCase()}
            </span>
          </div>

          {/* Header fiscal */}
          <div className="fiscal-head">
            {/* Emisor */}
            <div className="emisor">
              <div className="brand-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-nova-dark.png" alt="Nova Agency" className="agency-logo" />
                <div>
                  <div className="brand-name">{COMPANY.tradeName}</div>
                  <div className="brand-tag">Agencia Digital</div>
                </div>
              </div>
              <p className="em-line"><strong>{COMPANY.legalName}</strong></p>
              <p className="em-line">{COMPANY.address}</p>
              <p className="em-line">{COMPANY.city}</p>
              <p className="em-line">IVA: <strong>{COMPANY.taxCondition}</strong></p>
            </div>

            {/* Letra del comprobante */}
            <div className="letter-box">
              <div className="letter">{tipo}</div>
              <div className="letter-cod">COD. {codigo}</div>
            </div>

            {/* Comprobante */}
            <div className="comp">
              <div className="comp-title">{comprobante.startsWith('FACTURA') ? 'FACTURA' : comprobante}</div>
              <div className="comp-grid">
                <div className="comp-num">N° {numero}</div>
                <div><span className="k">Fecha: </span><span className="v">{issued}</span></div>
                <div><span className="k">CUIT: </span><span className="v">{COMPANY.cuit}</span></div>
                <div><span className="k">Ingresos Brutos: </span><span className="v">{COMPANY.grossIncome}</span></div>
                {COMPANY.startDate && (
                  <div><span className="k">Inicio actividades: </span><span className="v">{fmtDate(COMPANY.startDate)}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Receptor */}
          <div className="receptor">
            <div className="rec-grid">
              <div className="field">
                <div className="lbl">Cliente</div>
                <div className="val">{recName}</div>
                {client?.contact_person && <div style={{ fontSize: 11, color: '#64748b' }}>{client.contact_person}</div>}
              </div>
              <div className="field">
                <div className="lbl">CUIT / CUIL / DNI</div>
                <div className="val">{client?.tax_id || '—'}</div>
              </div>
              <div className="field">
                <div className="lbl">Domicilio</div>
                <div className="val" style={{ fontWeight: 500, fontSize: 12 }}>{client?.fiscal_address || client?.email || '—'}</div>
              </div>
              <div className="field">
                <div className="lbl">Condición frente al IVA</div>
                <div className="val" style={{ fontWeight: 500, fontSize: 12 }}>{recCond}</div>
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="inv-body">
            <div className="meta-row">
              <div className="meta-item">
                <div className="lbl">Condición de venta</div>
                <div className="val">{paid ? 'Contado' : 'Cuenta corriente'}</div>
              </div>
              {due && (
                <div className="meta-item">
                  <div className="lbl">Vencimiento</div>
                  <div className={`val ${inv.status === 'overdue' ? 'red' : ''}`}>{due}</div>
                </div>
              )}
              {paid && (
                <div className="meta-item">
                  <div className="lbl">Fecha de pago</div>
                  <div className="val green">{paid}</div>
                </div>
              )}
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th className="th">Descripción</th>
                  <th className="th th-r" style={{ width: 90 }}>Cant.</th>
                  <th className="th th-r" style={{ width: 150 }}>P. Unitario</th>
                  <th className="th th-r" style={{ width: 150 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td td-desc" id="invoice-description">{inv.description || 'Servicios profesionales'}</td>
                  <td className="td td-r">1</td>
                  <td className="td td-r">$ {fmtMoney(total)}</td>
                  <td className="td td-r">$ {fmtMoney(total)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totales */}
            <div className="totals">
              <div className="totals-inner">
                <div className="tot-row"><span>Subtotal</span><span className="v">$ {fmtMoney(total)}</span></div>
                <div className="tot-row"><span>Otros tributos</span><span className="v">$ 0,00</span></div>
                <div className="tot-total">
                  <span className="lbl">Total ARS</span>
                  <span className="amt">$ {fmtMoney(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CAE / Leyendas */}
          <div className="cae-zone">
            <p className="legend">
              <strong>Comprobante tipo {tipo} — Régimen de Monotributo.</strong> El monto no discrimina IVA.
              {tipo === 'X' && ' Documento sin valor fiscal.'}
            </p>
            <div className="cae-box">
              {inv.cae ? (
                <>
                  <div className="lbl">CAE N°</div>
                  <div className="num">{inv.cae}</div>
                  {caeVto && <div className="vto">Vto. CAE: {caeVto}</div>}
                </>
              ) : (
                <span className="cae-pending">Sin CAE asignado</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="inv-footer">
            <div>
              <p className="footer-text">{COMPANY.tradeName} · {COMPANY.website}</p>
              <p className="footer-amber">{COMPANY.instagram}</p>
            </div>
            <p className="footer-text">Generado el {new Date().toLocaleDateString('es-AR')}</p>
          </div>

        </div>
      </div>

      <PrintButtons invoiceId={id} />
    </>
  )
}
