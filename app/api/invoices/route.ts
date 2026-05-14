import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const status   = url.searchParams.get('status')
  const clientId = url.searchParams.get('client_id')

  let query = supabase
    .from('invoices')
    .select('*, clients(name, email), projects(id, name, budget)')
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calcular MRR y totales
  const all = data || []
  const paid    = all.filter(i => i.status === 'paid').reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)
  const pending = all.filter(i => i.status === 'pending').reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)
  const overdue = all.filter(i => i.status === 'overdue').reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)

  // MRR: facturas pagadas en los últimos 30 días
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const mrr = all
    .filter(i => i.status === 'paid' && i.paid_at && i.paid_at > thirtyDaysAgo)
    .reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)

  return NextResponse.json({ invoices: all, stats: { paid, pending, overdue, mrr } })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  // Generar número de factura
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase.from('invoices').insert({
    client_id:      body.client_id,
    project_id:     body.project_id || null,
    amount:         body.amount,
    status:         body.status   || 'pending',
    description:    body.description || null,
    due_date:       body.due_date  || null,
    invoice_number: invoiceNumber,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Factura ${invoiceNumber} creada por $${body.amount}`,
    status: 'executed', created_by: 'Sistema',
  })

  return NextResponse.json({ invoice: data })
}
