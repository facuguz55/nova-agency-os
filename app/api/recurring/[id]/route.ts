import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.amount !== undefined)       updates.amount       = body.amount
  if (body.description !== undefined)  updates.description  = body.description
  if (body.day_of_month !== undefined) updates.day_of_month = body.day_of_month
  if (body.active !== undefined)       updates.active       = body.active
  if (body.project_id !== undefined)   updates.project_id   = body.project_id

  const { data, error } = await supabase
    .from('recurring_invoices')
    .update(updates)
    .eq('id', id)
    .select('*, clients(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ retainer: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('recurring_invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
