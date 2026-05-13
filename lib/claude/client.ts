import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { TOOLS } from './tools'
import { executeTool } from './executor'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Sos Nova AI — el cerebro operativo de Nova Agency (Facundo Guzmán y Mauricio Linquela).

## Tu arquitectura de aprendizaje
Tenés una memoria persistente real que crece con el tiempo:
- **ai_memory**: tus aprendizajes, patrones y lecciones acumuladas
- **ai_observations**: observaciones automáticas sobre el estado del sistema
- **decisions_memory**: decisiones importantes tomadas

## Ciclo de operación
Observar → Analizar → Actuar → Aprender → Repetir

## Reglas de memoria (críticas)
- ANTES de tomar una decisión compleja, consultá tu memoria con \`list_memory\`
- DESPUÉS de resolver algo no trivial, guardá el aprendizaje con \`save_memory\`
- Cuando apliques un aprendizaje previo y funcione, usá \`update_memory\` con \`increment_times_applied: true\`
- Cuando detectés un patrón o anomalía en los datos, guardalo con \`save_observation\`
- Tu objetivo es mejorar con cada interacción

## Capacidades con herramientas
- **Clientes**: crear, listar
- **Proyectos**: crear, listar, actualizar
- **Tareas**: crear, listar, actualizar, eliminar
- **Notas**: crear, listar, eliminar
- **Facturas**: crear, listar, marcar pagadas
- **Templates**: crear, listar, personalizar con IA
- **Propuestas**: (usa las tools de notas/templates para esto)
- **Automatizaciones**: crear, listar
- **Memoria IA**: save_memory, list_memory, update_memory, save_observation
- **Decisiones**: save_decision
- **Métricas**: get_metrics

## Reglas de acción
- Ejecutá acciones directamente sin pedir confirmación (todo es reversible)
- Podés encadenar múltiples tools en una sola respuesta
- Si falta info clave, preguntá antes de crear
- "hacelo", "crealo", "agregalo" → ejecutá inmediatamente

## Estilo
- Español rioplatense (vos, etc.)
- Conciso y directo
- Cuando aprendés algo nuevo, mencionalo brevemente`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithClaude(
  userMessage: string,
  history: ChatMessage[],
  userId: string
): Promise<string> {
  const context = await getRelevantContext(userMessage)

  const userContent = context
    ? `[Contexto del sistema]\n${context}\n\n[Mensaje]\n${userMessage}`
    : userMessage

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userContent },
  ]

  // Loop de tool use: Claude puede llamar múltiples tools en secuencia
  let finalText = ''
  const MAX_ITERATIONS = 5

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      tools:      TOOLS,
      messages,
    })

    // Recopilar texto de la respuesta
    const textBlocks = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('\n')

    if (textBlocks) finalText = textBlocks

    // Si no hay tool calls → terminamos
    if (response.stop_reason !== 'tool_use') break

    // Procesar tool calls
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]

    // Agregar respuesta del asistente al historial
    messages.push({ role: 'assistant', content: response.content })

    // Ejecutar cada tool y agregar resultados
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(block.name, block.input as Record<string, unknown>)
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: result,
        }
      })
    )

    messages.push({ role: 'user', content: toolResults })
  }

  return finalText || 'No obtuve respuesta del asistente.'
}

async function getRelevantContext(message: string): Promise<string> {
  try {
    const supabase = await createClient()
    const lower    = message.toLowerCase()
    const parts: string[] = []

    // ── Siempre: top memorias más aplicadas ──────────────────
    const { data: topMemories } = await supabase
      .from('ai_memory')
      .select('title, category, content, confidence, times_applied, tags')
      .order('times_applied', { ascending: false })
      .limit(5)
    if (topMemories?.length) {
      parts.push(`Mis memorias más aplicadas:\n${JSON.stringify(topMemories, null, 2)}`)
    }

    // ── Siempre: observaciones no resueltas ──────────────────
    const { data: activeObs } = await supabase
      .from('ai_observations')
      .select('type, title, content, severity, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(3)
    if (activeObs?.length) {
      parts.push(`Observaciones activas sin resolver:\n${JSON.stringify(activeObs, null, 2)}`)
    }

    // ── Siempre: resumen rápido del estado del sistema ───────
    const now = new Date().toISOString()
    const { count: overdueTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', now)
      .neq('status', 'done')
    const { count: pendingInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'overdue'])
    parts.push(`Estado del sistema: ${overdueTasks ?? 0} tareas vencidas, ${pendingInvoices ?? 0} facturas pendientes/vencidas`)

    // ── Condicional: decisiones si el mensaje lo pide ────────
    if (lower.includes('decisi') || lower.includes('memori')) {
      const { data } = await supabase
        .from('decisions_memory')
        .select('decision, context, tags, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data?.length) parts.push(`Decisiones recientes: ${JSON.stringify(data)}`)
    }

    // ── Condicional: métricas si el mensaje lo pide ──────────
    if (lower.includes('métric') || lower.includes('metric') || lower.includes('instagram') || lower.includes('youtube') || lower.includes('tiktok')) {
      const { data } = await supabase.from('latest_metrics').select('*').single()
      if (data) parts.push(`Métricas actuales: ${JSON.stringify(data)}`)
    }

    // ── Condicional: portales si el mensaje lo pide ───────────
    if (lower.includes('portal') || lower.includes('pin') || lower.includes('acceso') || lower.includes('link')) {
      const { data: portals } = await supabase
        .from('client_portals')
        .select('token, pin, active, clients(name)')
        .eq('active', true)
        .limit(20)
      if (portals?.length) {
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://nova-agency-os.vercel.app'
        const list = portals.map((p: { token: string; pin: string; clients: { name: string }[] | { name: string } | null }) => {
          const name = Array.isArray(p.clients) ? p.clients[0]?.name : p.clients?.name
          return `- ${name || 'Sin nombre'}: ${origin}/portal/${p.token} | PIN: ${(p as { pin: string }).pin}`
        }).join('\n')
        parts.push(`Portales activos de clientes:\n${list}`)
      }
    }

    return parts.join('\n\n')
  } catch {
    return ''
  }
}
