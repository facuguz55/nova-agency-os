import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/expenses?month=6&year=2026
// Devuelve los gastos del mes: los puntuales del mes + los fijos
// (recurring=true) desde su fecha de alta en adelante.
export async function GET(req: Request) {
  const supabase = await createClient()
  const url   = new URL(req.url)
  const now   = new Date()
  const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1))
  const year  = parseInt(url.searchParams.get('year')  || String(now.getFullYear()))

  const from = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const to   = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: oneOff, error: e1 }, { data: fixed, error: e2 }] = await Promise.all([
    supabase.from('expenses').select('*').eq('recurring', false).gte('expense_date', from).lte('expense_date', to).order('expense_date', { ascending: false }),
    supabase.from('expenses').select('*').eq('recurring', true).lte('expense_date', to).order('amount', { ascending: false }),
  ])

  const error = e1 || e2
  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })

  const expenses = [...(fixed || []), ...(oneOff || [])]
  const total    = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return NextResponse.json({ expenses, total })
}

// POST /api/expenses → crear gasto
export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  if (!body.label || !body.amount) {
    return NextResponse.json({ error: 'label y amount son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase.from('expenses').insert({
    label:        body.label,
    amount:       body.amount,
    category:     body.category || 'otro',
    expense_date: body.expense_date || new Date().toISOString().split('T')[0],
    recurring:    body.recurring ?? false,
    notes:        body.notes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  return NextResponse.json({ expense: data })
}
