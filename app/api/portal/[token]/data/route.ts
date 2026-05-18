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

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  const [clientRes, projectsRes, subprojectsRes, tasksRes, reportsRes, teamRes, objectivesRes, feedbackRes, roadmapRes] = await Promise.all([
    supabase.from('clients').select('id,name,email,industry,contact_person,notes,created_at').eq('id', cid).single(), // created_at para calcular días juntos
    supabase.from('projects').select('id,name,status,budget,description,created_at,updated_at,featured_until').eq('client_id', cid).is('parent_id', null).order('created_at', { ascending: false }),
    supabase.from('projects').select('id,name,status,budget,description,parent_id,created_at').eq('client_id', cid).not('parent_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id,title,status,priority,due_date,assigned_to').eq('client_id', cid).order('due_date', { ascending: true }),
    supabase.from('portal_reports').select('*').eq('portal_id', portal.id).order('created_at', { ascending: false }),
    supabase.from('team_members').select('id,name,role,whatsapp').eq('status', 'active').order('created_at'),
    supabase.from('project_objectives').select('id,project_id,title,current_value,target_value,unit').in('project_id', []).then(() => ({ data: [] as { id: string; project_id: string; title: string; current_value: number; target_value: number; unit: string }[], error: null })),
    supabase.from('portal_feedback').select('project_id,vote').eq('client_id', cid),
    supabase.from('portal_roadmap').select('id,week,title,items').eq('client_id', cid).eq('month', currentMonth).eq('year', currentYear).order('week'),
  ])

  const projectIds = (projectsRes.data || []).map(p => p.id)
  const objectivesReal = projectIds.length > 0
    ? await supabase.from('project_objectives').select('id,project_id,title,current_value,target_value,unit').in('project_id', projectIds)
    : { data: [] }

  const topProjects = (projectsRes.data || []).map(p => ({
    ...p,
    subprojects: (subprojectsRes.data || []).filter(s => s.parent_id === p.id),
    objectives:  (objectivesReal.data || []).filter(o => o.project_id === p.id),
    feedback:    (feedbackRes.data || []).find(f => f.project_id === p.id)?.vote ?? null,
  }))

  return NextResponse.json({
    client:   clientRes.data,
    projects: topProjects,
    tasks:    tasksRes.data     || [],
    reports:  reportsRes.data   || [],
    team:     teamRes.data      || [],
    roadmap:  roadmapRes.data   || [],
  })
}
