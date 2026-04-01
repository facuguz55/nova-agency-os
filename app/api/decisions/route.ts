import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const search = url.searchParams.get('search')
  const tag = url.searchParams.get('tag')

  let query = supabase
    .from('decisions_memory')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (search) query = query.ilike('decision', `%${search}%`)
  if (tag) query = query.contains('tags', [tag])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('decisions_memory')
    .insert({
      decision: body.decision,
      context: body.context,
      impact: body.impact || null,
      tags: body.tags || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'decision',
    description: `Decisión guardada: ${body.decision.slice(0, 80)}`,
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ decision: data })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase.from('decisions_memory').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
