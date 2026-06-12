import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/recurring/generate { month?, year? }
// Genera las facturas del mes para todos los retainers activos que
// todavía no tienen factura ese mes. Idempotente: corre las veces que quieras.
export async function POST(req: Request) {
  const supabase = await createClient()
  const body  = await req.json().catch(() => ({}))
  const now   = new Date()
  const month = body.month || now.getMonth() + 1
  const year  = body.year  || now.getFullYear()

  const { data: retainers, error } = await supabase
    .from('recurring_invoices')
    .select('*, clients(name)')
    .eq('active', true)

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  if (!retainers?.length) return NextResponse.json({ created: 0, skipped: 0, invoices: [] })

  // Facturas ya generadas este mes
  const from = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const to   = new Date(year, month, 0).toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('invoices')
    .select('recurring_id')
    .in('recurring_id', retainers.map(r => r.id))
    .gte('due_date', from)
    .lte('due_date', to)
  const already = new Set((existing || []).map(i => i.recurring_id))

  const pending = retainers.filter(r => !already.has(r.id))
  if (!pending.length) {
    return NextResponse.json({ created: 0, skipped: retainers.length, invoices: [] })
  }

  // Numeración: seguir desde la última factura
  const { data: last } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  let nextNum = (last?.invoice_number ? parseInt(last.invoice_number.replace('INV-', ''), 10) : 0) + 1

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const createdInvoices = []

  for (const r of pending) {
    const lastDay = new Date(year, month, 0).getDate()
    const dueDay  = Math.min(r.day_of_month || 5, lastDay)
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

    const { data: inv, error: invError } = await supabase.from('invoices').insert({
      client_id:      r.client_id,
      project_id:     r.project_id || null,
      amount:         r.amount,
      status:         'pending',
      description:    `${r.description || 'Fee mensual'} — ${MONTHS[month - 1]} ${year}`,
      due_date:       dueDate,
      invoice_number: `INV-${String(nextNum).padStart(4, '0')}`,
      recurring_id:   r.id,
    }).select('invoice_number, amount, clients(name)').single()

    if (!invError && inv) {
      nextNum++
      createdInvoices.push(inv)
    }
  }

  if (createdInvoices.length) {
    await supabase.from('actions_log').insert({
      action_type: 'other',
      description: `${createdInvoices.length} factura(s) recurrente(s) generada(s) para ${MONTHS[month - 1]} ${year}`,
      status: 'executed', created_by: 'Sistema',
    })
  }

  return NextResponse.json({
    created: createdInvoices.length,
    skipped: retainers.length - pending.length,
    invoices: createdInvoices,
  })
}
