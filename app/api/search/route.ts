import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const url   = new URL(req.url)
  const q     = url.searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const term = `%${q}%`

  const [clients, projects, automations, tasks, notes, decisions, actions] = await Promise.all([
    supabase.from('clients').select('id, name, email, status').ilike('name', term).limit(5),
    supabase.from('projects').select('id, name, status, clients(name)').ilike('name', term).limit(5),
    supabase.from('automations').select('id, name, status, trigger_type').ilike('name', term).limit(5),
    supabase.from('tasks').select('id, title, status, priority').ilike('title', term).limit(5),
    supabase.from('notes').select('id, title, content').ilike('title', term).limit(5),
    supabase.from('decisions_memory').select('id, decision, tags').ilike('decision', term).limit(5),
    supabase.from('actions_log').select('id, description, action_type, status').ilike('description', term).limit(5),
  ])

  const results = [
    ...(clients.data || []).map(r => ({ type: 'client', label: r.name, sub: r.email || r.status, href: `/clients/${r.id}` })),
    ...(projects.data || []).map((r: { id: string; name: string; status: string; clients: { name: string } | null }) => ({ type: 'project', label: r.name, sub: r.clients?.name || r.status, href: `/projects/${r.id}` })),
    ...(automations.data || []).map(r => ({ type: 'automation', label: r.name, sub: r.trigger_type, href: '/automations' })),
    ...(tasks.data || []).map(r => ({ type: 'task', label: r.title, sub: `${r.priority} · ${r.status}`, href: '/tasks' })),
    ...(notes.data || []).map(r => ({ type: 'note', label: r.title, sub: (r.content || '').slice(0, 60), href: '/notes' })),
    ...(decisions.data || []).map(r => ({ type: 'decision', label: r.decision.slice(0, 80), sub: (r.tags || []).join(', '), href: '/chat' })),
    ...(actions.data || []).map(r => ({ type: 'action', label: r.description.slice(0, 80), sub: `${r.action_type} · ${r.status}`, href: '/audit' })),
  ]

  return NextResponse.json({ results })
}
