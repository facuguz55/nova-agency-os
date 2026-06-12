import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recurring?month=6&year=2026 → lista de retainers
// Incluye invoiced_this_month para saber si ya se generó la factura del mes pedido
export async function GET(req: Request) {
  const supabase = await createClient()
  const url   = new URL(req.url)
  const now   = new Date()
  const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1))
  const year  = parseInt(url.searchParams.get('year')  || String(now.getFullYear()))

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select('*, clients(name), projects(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })

  // Facturas ya generadas en el mes pedido (por recurring_id)
  const from = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const to   = new Date(year, month, 0).toISOString().split('T')[0]
  const ids  = (data || []).map(r => r.id)
  const invoicedSet = new Set<string>()
  if (ids.length) {
    const { data: invs } = await supabase
      .from('invoices')
      .select('recurring_id')
      .in('recurring_id', ids)
      .gte('due_date', from)
      .lte('due_date', to)
    for (const i of invs || []) if (i.recurring_id) invoicedSet.add(i.recurring_id)
  }

  const retainers = (data || []).map(r => ({ ...r, invoiced_this_month: invoicedSet.has(r.id) }))
  const mrr = retainers.filter(r => r.active).reduce((s, r) => s + Number(r.amount), 0)

  return NextResponse.json({ retainers, mrr })
}

// POST /api/recurring → crear retainer
export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  if (!body.client_id || !body.amount) {
    return NextResponse.json({ error: 'client_id y amount son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase.from('recurring_invoices').insert({
    client_id:    body.client_id,
    project_id:   body.project_id || null,
    amount:       body.amount,
    description:  body.description || null,
    day_of_month: body.day_of_month || 5,
    active:       body.active ?? true,
  }).select('*, clients(name)').single()

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Retainer creado: ${data.clients?.name || ''} — $${body.amount}/mes`,
    status: 'executed', created_by: 'Sistema',
  })

  return NextResponse.json({ retainer: data })
}
