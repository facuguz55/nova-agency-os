import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.label !== undefined)        updates.label        = body.label
  if (body.amount !== undefined)       updates.amount       = body.amount
  if (body.category !== undefined)     updates.category     = body.category
  if (body.expense_date !== undefined) updates.expense_date = body.expense_date
  if (body.recurring !== undefined)    updates.recurring    = body.recurring
  if (body.notes !== undefined)        updates.notes        = body.notes

  const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
