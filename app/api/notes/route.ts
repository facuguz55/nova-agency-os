import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const projectId = url.searchParams.get('project_id')
  const clientId  = url.searchParams.get('client_id')
  const search    = url.searchParams.get('search')

  let query = supabase
    .from('notes')
    .select('*, projects(name), clients(name)')
    .order('updated_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (clientId)  query = query.eq('client_id', clientId)
  if (search)    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('notes').insert({
    title:      body.title,
    content:    body.content || null,
    project_id: body.project_id || null,
    client_id:  body.client_id  || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}
