import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const [
    { count: totalClients },
    { count: activeProjects },
    { count: pendingActions },
    { data: recentActions },
    { data: workflowStats },
    { data: urgentTasks },
    { data: allActiveClients },
    { data: projectsByStatus },
    { data: tasksByPriority },
    { data: recentInvoices },
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
    supabase.from('projects').select('status'),
    supabase.from('tasks').select('priority, status').neq('status', 'done'),
    supabase.from('invoices')
      .select('amount, status, paid_at, created_at')
      .gte('created_at', sixMonthsAgo.toISOString()),
  ])

  const wfSuccess = workflowStats?.filter(w => w.status === 'success').length || 0
  const wfTotal = workflowStats?.length || 0

  // Clientes sin actividad en más de 14 días
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString()
  const coldClients = (allActiveClients || [])
    .filter(c => !c.updated_at || c.updated_at < cutoff)
    .slice(0, 4)

  // Revenue por mes (últimos 6 meses)
  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const revenueByMonth: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
    revenueByMonth[key] = 0
  }
  for (const inv of (recentInvoices || [])) {
    if (inv.status === 'paid' && inv.paid_at) {
      const d = new Date(inv.paid_at)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      if (key in revenueByMonth) revenueByMonth[key] += Number(inv.amount) || 0
    }
  }
  const revenueChart = Object.entries(revenueByMonth).map(([key, total]) => {
    const [y, m] = key.split('-')
    return { month: MONTHS_ES[parseInt(m)], total }
  })

  // Proyectos por estado
  const projectStatusMap: Record<string, number> = { active: 0, planning: 0, completed: 0, paused: 0 }
  for (const p of (projectsByStatus || [])) projectStatusMap[p.status] = (projectStatusMap[p.status] || 0) + 1
  const projectsChart = Object.entries(projectStatusMap).map(([status, count]) => ({ status, count }))

  // Tareas por prioridad
  const priorityMap: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 }
  for (const t of (tasksByPriority || [])) priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1
  const tasksChart = Object.entries(priorityMap).map(([priority, count]) => ({ priority, count }))

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
    revenueChart,
    projectsChart,
    tasksChart,
  })
}
