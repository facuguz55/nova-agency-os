import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkflows, getExecutions, formatExecutionsForDB } from '@/lib/n8n/client'

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit  = parseInt(url.searchParams.get('limit') || '50')
  const sync   = url.searchParams.get('sync') === 'true'

  const supabase = await createClient()
  let syncResult: { inserted: number; skipped: number; error?: string } | null = null

  if (sync) {
    try {
      // 1. Traer workflows para mapear id → nombre
      const workflows = await getWorkflows()
      const workflowMap = new Map(workflows.map(w => [w.id, w.name]))

      // 2. Traer últimas 100 ejecuciones
      const executions = await getExecutions(undefined, 100)

      if (executions.length === 0) {
        syncResult = { inserted: 0, skipped: 0 }
      } else {
        const formatted = await formatExecutionsForDB(executions, workflowMap)

        // 3. Verificar cuáles execution_ids ya existen
        const incomingIds = formatted.map(f => f.execution_id)
        const { data: existing } = await supabase
          .from('workflow_logs')
          .select('execution_id')
          .in('execution_id', incomingIds)

        const existingIds = new Set((existing || []).map((r: { execution_id: string }) => r.execution_id))
        const toInsert = formatted.filter(f => !existingIds.has(f.execution_id))

        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('workflow_logs')
            .insert(toInsert)

          if (insertError) {
            syncResult = { inserted: 0, skipped: formatted.length, error: insertError.message }
          } else {
            syncResult = { inserted: toInsert.length, skipped: formatted.length - toInsert.length }
          }
        } else {
          syncResult = { inserted: 0, skipped: formatted.length }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      syncResult = { inserted: 0, skipped: 0, error: msg }
    }
  }

  // 4. Traer logs desde DB
  let query = supabase
    .from('workflow_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs: data || [],
    sync: syncResult,
  })
}
