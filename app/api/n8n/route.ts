import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkflows, getExecutions, formatExecutionsForDB } from '@/lib/n8n/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const sync = url.searchParams.get('sync') === 'true'

  const supabase = await createClient()

  if (sync) {
    try {
      const workflows = await getWorkflows()
      const workflowMap = new Map(workflows.map(w => [w.id, w.name]))
      const executions = await getExecutions(undefined, 100)
      const formatted = await formatExecutionsForDB(executions, workflowMap)

      if (formatted.length > 0) {
        await supabase.from('workflow_logs').upsert(
          formatted.map(f => ({ ...f, execution_id: f.execution_id })),
          { onConflict: 'execution_id', ignoreDuplicates: true }
        )
      }
    } catch (err) {
      console.error('n8n sync error:', err)
    }
  }

  let query = supabase
    .from('workflow_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data || [] })
}
