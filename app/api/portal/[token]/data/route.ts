import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const pin = req.nextUrl.searchParams.get('pin')
  const supabase = await createClient()

  // Verificar token y PIN
  const { data: portal, error: pErr } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (pErr || !portal)       return NextResponse.json({ error: 'Portal no encontrado' }, { status: 404 })
  if (!portal.active)        return NextResponse.json({ error: 'Portal inactivo' }, { status: 403 })
  if (portal.pin !== pin)    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  const cid = portal.client_id

  const [clientRes, projectsRes, tasksRes, reportsRes] = await Promise.all([
    supabase.from('clients').select('id,name,email,industry,contact_person,notes,created_at').eq('id', cid).single(),
    supabase.from('projects').select('id,name,status,budget,created_at,updated_at').eq('client_id', cid).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id,title,status,priority,due_date,assigned_to').eq('client_id', cid).neq('status', 'done').order('created_at', { ascending: false }),
    supabase.from('portal_reports').select('*').eq('portal_id', portal.id).order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    client:   clientRes.data,
    projects: projectsRes.data || [],
    tasks:    tasksRes.data    || [],
    reports:  reportsRes.data  || [],
  })
}
