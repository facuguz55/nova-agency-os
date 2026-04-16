import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id }   = await params
  const body     = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.status  !== undefined) updates.status  = body.status
  if (body.content !== undefined) updates.content = body.content

  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select('*, clients(name, industry, notes, email)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proposal: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id }   = await params

  const { error } = await supabase.from('proposals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
