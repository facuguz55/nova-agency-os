import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  // Fetch existing to avoid overwriting paid_at when editing an already-paid invoice
  const { data: existing } = await supabase
    .from('invoices')
    .select('paid_at, status')
    .eq('id', id)
    .single()

  if (body.status === 'paid') {
    if (body.paid_at) {
      // User explicitly set a date — use it
    } else if (!existing?.paid_at || existing?.status !== 'paid') {
      // Transitioning to paid for the first time
      body.paid_at = new Date().toISOString()
    }
    // else: already paid and no new date provided — don't touch paid_at
  }

  const { data, error } = await supabase.from('invoices').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
