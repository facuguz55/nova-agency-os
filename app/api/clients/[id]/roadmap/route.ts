import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const now = new Date()
  const month = parseInt(req.nextUrl.searchParams.get('month') || String(now.getMonth() + 1))
  const year  = parseInt(req.nextUrl.searchParams.get('year')  || String(now.getFullYear()))

  const { data } = await supabase
    .from('portal_roadmap')
    .select('id,week,title,items,month,year')
    .eq('client_id', id)
    .eq('month', month)
    .eq('year', year)
    .order('week')

  return NextResponse.json({ roadmap: data || [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  const { week, title, items, month, year } = body

  const { data, error } = await supabase
    .from('portal_roadmap')
    .upsert(
      { client_id: id, week, title: title || '', items: items || [], month, year },
      { onConflict: 'client_id,week,month,year' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roadmap: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { month, year } = await req.json()

  await supabase
    .from('portal_roadmap')
    .delete()
    .eq('client_id', id)
    .eq('month', month)
    .eq('year', year)

  return NextResponse.json({ ok: true })
}
