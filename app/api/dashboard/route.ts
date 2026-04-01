import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: activeProjects },
    { count: pendingActions },
    { data: recentActions },
    { data: metrics },
    { data: workflowStats },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['active', 'planning']),
    supabase.from('actions_log').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('recent_actions_view').select('*'),
    supabase.from('latest_metrics').select('*').single(),
    supabase.from('workflow_logs').select('status').order('timestamp', { ascending: false }).limit(50),
  ])

  const wfSuccess = workflowStats?.filter(w => w.status === 'success').length || 0
  const wfTotal = workflowStats?.length || 0

  return NextResponse.json({
    stats: {
      totalClients: totalClients || 0,
      activeProjects: activeProjects || 0,
      pendingActions: pendingActions || 0,
      workflowSuccessRate: wfTotal > 0 ? Math.round((wfSuccess / wfTotal) * 100) : 0,
    },
    recentActions: recentActions || [],
    metrics: metrics || null,
  })
}
