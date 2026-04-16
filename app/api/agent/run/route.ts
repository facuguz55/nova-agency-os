import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { TOOLS } from '@/lib/claude/tools'
import { executeTool } from '@/lib/claude/executor'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const AGENT_SYSTEM = `Sos Nova AI ejecutando una tarea automática o programada en Nova Agency.
Tenés acceso a todas las herramientas del sistema: tareas, notas, facturas, templates, clientes, proyectos, automatizaciones.
Ejecutá lo que se te pida de forma autónoma. Usá las herramientas necesarias sin pedir confirmación.
Respondé en español rioplatense. Sé conciso: listá las acciones realizadas y el resultado.`

/**
 * POST /api/agent/run
 * Body: { prompt: string, source?: string, secret?: string }
 *
 * Ejecuta el agente IA de forma autónoma con el prompt dado.
 * Puede ser llamado desde n8n, webhooks, cron jobs, u otras automatizaciones.
 *
 * Autenticación: opcionalmente verificar AGENT_SECRET del env para llamadas externas.
 */
export async function POST(req: Request) {
  const body = await req.json()
  const { prompt, source = 'api', secret } = body

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Se requiere un prompt' }, { status: 400 })
  }

  // Verificar secret si está configurado (para llamadas externas desde n8n / webhooks)
  const agentSecret = process.env.AGENT_SECRET
  if (agentSecret && secret !== agentSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createClient()
  const startedAt = Date.now()

  try {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]
    let finalText = ''
    const toolsUsed: string[] = []
    const MAX_ITERATIONS = 8

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system:     AGENT_SYSTEM,
        tools:      TOOLS,
        messages,
      })

      const textBlocks = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('\n')

      if (textBlocks) finalText = textBlocks
      if (response.stop_reason !== 'tool_use') break

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      messages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          toolsUsed.push(block.name)
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          return { type: 'tool_result' as const, tool_use_id: block.id, content: result }
        })
      )

      messages.push({ role: 'user', content: toolResults })
    }

    const durationMs = Date.now() - startedAt

    // Loguear la ejecución autónoma
    await supabase.from('actions_log').insert({
      action_type:  'other',
      description:  `[Agente ${source}] ${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}`,
      status:       'executed',
      created_by:   `Nova AI (${source})`,
    })

    return NextResponse.json({
      result:     finalText || 'Tarea ejecutada sin respuesta de texto.',
      tools_used: toolsUsed,
      duration_ms: durationMs,
      source,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    await supabase.from('actions_log').insert({
      action_type: 'other',
      description: `[Agente ${source}] Error: ${message.slice(0, 200)}`,
      status:      'failed',
      created_by:  `Nova AI (${source})`,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
