import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: activeProjects },
    { count: pendingActions },
    { data: recentActions },
    { data: workflowStats },
    { data: urgentTasks },
    { data: allActiveClients },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['active', 'planning']),
    supabase.from('actions_log').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('recent_actions_view').select('*'),
    supabase.from('workflow_logs').select('status').order('timestamp', { ascending: false }).limit(50),
    supabase.from('tasks')
      .select('id, title, priority, status, due_date, assigned_to')
      .in('priority', ['urgent', 'high'])
      .neq('status', 'done')
      .order('priority', { ascending: true })
      .limit(6),
    supabase.from('clients')
      .select('id, name, status, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: true })
      .limit(20),
  ])

  const wfSuccess = workflowStats?.filter(w => w.status === 'success').length || 0
  const wfTotal = workflowStats?.length || 0

  // Clientes sin actividad en más de 14 días
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString()
  const coldClients = (allActiveClients || [])
    .filter(c => !c.updated_at || c.updated_at < cutoff)
    .slice(0, 4)

  return NextResponse.json({
    stats: {
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      pendingActions: pendingActions || 0,
      workflowSuccessRate: wfTotal > 0 ? Math.round((wfSuccess / wfTotal) * 100) : 0,
    },
    recentActions: recentActions || [],
    urgentTasks: urgentTasks || [],
    coldClients,
  })
}
