import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — lista pagos de una factura + resumen
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase.from('invoices').select('id, amount, status, invoice_number, clients(name)').eq('id', id).single(),
    supabase.from('invoice_payments').select('*').eq('invoice_id', id).order('paid_at', { ascending: false }),
  ])

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

  const total_paid = (payments || []).reduce((s, p) => s + Number(p.amount), 0)
  const remaining  = Math.max(0, Number(invoice.amount) - total_paid)

  return NextResponse.json({
    invoice,
    payments: payments || [],
    total_paid,
    remaining,
  })
}

// POST — registrar un pago parcial
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  const { amount, paid_at, note } = body
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }

  // Obtener la factura
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, amount, status')
    .eq('id', id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })

  // Insertar el pago
  const { data: payment, error } = await supabase
    .from('invoice_payments')
    .insert({ invoice_id: id, amount: Number(amount), paid_at: paid_at || new Date().toISOString().split('T')[0], note: note || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calcular total pagado hasta ahora
  const { data: allPayments } = await supabase
    .from('invoice_payments')
    .select('amount')
    .eq('invoice_id', id)

  const totalPaid = (allPayments || []).reduce((s, p) => s + Number(p.amount), 0)
  const invoiceTotal = Number(invoice.amount)

  // Actualizar status de la factura
  let newStatus = invoice.status
  if (totalPaid >= invoiceTotal) {
    newStatus = 'paid'
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
  } else if (totalPaid > 0 && invoice.status !== 'paid') {
    newStatus = 'partial'
    await supabase
      .from('invoices')
      .update({ status: 'partial' })
      .eq('id', id)
  }

  return NextResponse.json({ payment, total_paid: totalPaid, remaining: Math.max(0, invoiceTotal - totalPaid), new_status: newStatus })
}
