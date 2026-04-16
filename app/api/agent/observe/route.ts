import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { TOOLS } from '@/lib/claude/tools'
import { executeTool } from '@/lib/claude/executor'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Verificar secret si está configurado
    if (process.env.AGENT_SECRET) {
      if (body.secret !== process.env.AGENT_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()
    const now      = new Date().toISOString()

    // ── Recopilar contexto del sistema ────────────────────────
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('title, priority, due_date, clients(name)')
      .lt('due_date', now)
      .neq('status', 'done')
      .limit(10)

    const { data: blockedTasks } = await supabase
      .from('tasks')
      .select('title, priority, clients(name)')
      .eq('status', 'blocked')
      .limit(10)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('invoice_number, amount, due_date, status, clients(name)')
      .in('status', ['pending', 'overdue'])
      .lt('created_at', thirtyDaysAgo)
      .limit(10)

    const { data: activeProjects } = await supabase
      .from('projects')
      .select('name, status, description, clients(name)')
      .eq('status', 'active')
      .limit(10)

    const { data: recentMemories } = await supabase
      .from('ai_memory')
      .select('title, category, content, times_applied')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: unresolvedObs } = await supabase
      .from('ai_observations')
      .select('type, title, severity, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    // ── Construir prompt de observación ──────────────────────
    const systemContext = `
Estado actual del sistema (${new Date().toLocaleString('es-AR')}):

TAREAS VENCIDAS (${overdueTasks?.length ?? 0}):
${JSON.stringify(overdueTasks ?? [], null, 2)}

TAREAS BLOQUEADAS (${blockedTasks?.length ?? 0}):
${JSON.stringify(blockedTasks ?? [], null, 2)}

FACTURAS PENDIENTES/VENCIDAS CON +30 DÍAS (${overdueInvoices?.length ?? 0}):
${JSON.stringify(overdueInvoices ?? [], null, 2)}

PROYECTOS ACTIVOS (${activeProjects?.length ?? 0}):
${JSON.stringify(activeProjects ?? [], null, 2)}

MIS MEMORIAS RECIENTES:
${JSON.stringify(recentMemories ?? [], null, 2)}

OBSERVACIONES SIN RESOLVER:
${JSON.stringify(unresolvedObs ?? [], null, 2)}
`.trim()

    const observePrompt = `Analizá el estado del sistema con la información que te paso. Usá las tools disponibles para: guardar observaciones importantes que no estén ya registradas, detectar patrones nuevos, actualizar memorias existentes si encontrás nueva evidencia, y crear nuevas memorias con aprendizajes relevantes. Sé proactivo y específico. No repitas observaciones que ya están sin resolver.`

    // ── Llamar a Claude con loop de tools ────────────────────
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `[Contexto del sistema]\n${systemContext}\n\n[Instrucción]\n${observePrompt}`,
      },
    ]

    let observationsCreated = 0
    let memoriesUpdated     = 0
    let finalResult         = ''
    const MAX_ITERATIONS    = 8

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system:     'Sos Nova AI — un agente autónomo de análisis. Analizás el estado del sistema y guardás observaciones y memorias. Sos conciso y proactivo.',
        tools:      TOOLS,
        messages,
      })

      const textBlocks = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('\n')
      if (textBlocks) finalResult = textBlocks

      if (response.stop_reason !== 'tool_use') break

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      messages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          if (block.name === 'save_observation') observationsCreated++
          if (block.name === 'save_memory' || block.name === 'update_memory') memoriesUpdated++
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: result,
          }
        })
      )

      messages.push({ role: 'user', content: toolResults })
    }

    // ── Loggear en actions_log ────────────────────────────────
    await supabase.from('actions_log').insert({
      action_type:  'other',
      description:  `Ciclo de observación autónoma: ${observationsCreated} observaciones, ${memoriesUpdated} memorias`,
      status:       'executed',
      created_by:   'Nova AI (observe)',
    })

    return NextResponse.json({
      observations_created: observationsCreated,
      memories_updated:     memoriesUpdated,
      result:               finalResult || 'Ciclo de observación completado.',
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
