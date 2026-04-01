import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase
    .from('automations')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ automations: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('automations').insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Automatización creada: ${body.name}`,
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ automation: data })
}
