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

  // Sin parent_id en query → solo proyectos raíz. Con parent_id → subproyectos de ese padre.
  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('projects').insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Proyecto creado: ${body.name}`,
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ project: data })
}
