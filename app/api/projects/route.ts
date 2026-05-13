import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const clientId = url.searchParams.get('client_id')

  const parentId = url.searchParams.get('parent_id')

  let query = supabase
    .from('projects')
    .select('*, clients(name, email)')
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (clientId) query = query.eq('client_id', clientId)

  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }

  let { data, error } = await query

  // Si falla (columna parent_id no existe aún), re-intentar sin ese filtro
  if (error && error.message.includes('parent_id')) {
    const fallback = await supabase
      .from('projects')
      .select('*, clients(name, email)')
      .order('created_at', { ascending: false })
    data  = fallback.data
    error = fallback.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  let { data, error } = await supabase.from('projects').insert(body).select().single()

  // Si falla por columnas que aún no existen en Supabase, reintentar sin ellas
  if (error && (error.message.includes('add_to_budget') || error.message.includes('parent_id'))) {
    const { add_to_budget, parent_id, ...safeBody } = body
    void add_to_budget; void parent_id
    const retry = await supabase.from('projects').insert(safeBody).select().single()
    data  = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Proyecto creado: ${body.name}`,
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ project: data })
}
