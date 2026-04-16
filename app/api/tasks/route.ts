import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const status    = url.searchParams.get('status')
  const projectId = url.searchParams.get('project_id')
  const clientId  = url.searchParams.get('client_id')

  let query = supabase
    .from('tasks')
    .select('*, projects(name), clients(name)')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (status)    query = query.eq('status', status)
  if (projectId) query = query.eq('project_id', projectId)
  if (clientId)  query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('tasks').insert({
    title:       body.title,
    description: body.description || null,
    status:      body.status      || 'todo',
    priority:    body.priority    || 'medium',
    assigned_to: body.assigned_to || null,
    project_id:  body.project_id  || null,
    client_id:   body.client_id   || null,
    due_date:    body.due_date    || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'other',
    description: `Tarea creada: ${body.title}`,
    status: 'executed', created_by: 'Sistema',
  })

  return NextResponse.json({ task: data })
}
