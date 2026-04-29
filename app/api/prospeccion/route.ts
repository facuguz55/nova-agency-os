import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url      = new URL(req.url)
  const estado   = url.searchParams.get('estado')
  const search   = url.searchParams.get('search')

  let query = supabase
    .from('prospectos_ig')
    .select('*')
    .order('fecha_envio', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (search) query = query.or(`username.ilike.%${search}%,nombre_marca.ilike.%${search}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prospectos: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body     = await req.json()

  const { data, error } = await supabase
    .from('prospectos_ig')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Prospecto creado: @${body.username}`,
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ prospecto: data })
}
