import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `Sos el asistente de IA de Nova Agency, una agencia digital run by Facundo Guzmán y Mauricio Linquela.

Tu rol es ser un asistente consultivo que:
- Responde preguntas internas basándose en los datos de la agencia
- Sugiere acciones y explica el razonamiento detrás de cada sugerencia
- NUNCA ejecuta acciones sin aprobación explícita del usuario
- Mantiene memoria de decisiones importantes

Niveles de acción:
- BAJO: Consultas de info, reportes → ejecutar automáticamente
- MEDIO: Emails, llamadas API, fetch de métricas → pedir "confirmalo" antes de ejecutar
- ALTO: Comandos SSH, operaciones sensibles → requiere email de confirmación a facuiguzman1@gmail.com o maurikinke9@gmail.com

Cuando el usuario pide una acción MEDIO:
1. Presentá un resumen de lo que vas a hacer
2. Esperá que digan "hacelo" o "confirmalo"
3. Solo entonces ejecutá

Cuando el usuario pide una acción ALTO:
1. Describí exactamente el comando/operación
2. Explicá el riesgo
3. Esperá aprobación → enviá email de confirmación → ejecutá

Respondé siempre en español rioplatense (vos, etc.).
Sé conciso y directo. Si no tenés datos suficientes, decilo.
Si vas a sugerir guardar una decisión importante, preguntá si la querés agregar a la memoria.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithClaude(
  userMessage: string,
  history: ChatMessage[],
  userId: string
): Promise<string> {
  // Obtener contexto relevante de la DB
  const context = await getRelevantContext(userMessage)

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user',
      content: context ? `[Contexto de la DB]\n${context}\n\n[Mensaje del usuario]\n${userMessage}` : userMessage,
    },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return text
}

async function getRelevantContext(message: string): Promise<string> {
  try {
    const supabase = await createClient()
    const lowerMsg = message.toLowerCase()
    const contextParts: string[] = []

    if (lowerMsg.includes('client') || lowerMsg.includes('cliente')) {
      const { data } = await supabase
        .from('clients')
        .select('name, email, industry, status, contact_person')
        .eq('status', 'active')
        .limit(10)
      if (data?.length) {
        contextParts.push(`Clientes activos: ${JSON.stringify(data)}`)
      }
    }

    if (lowerMsg.includes('proyecto') || lowerMsg.includes('project')) {
      const { data } = await supabase
        .from('projects')
        .select('name, status, description, budget')
        .in('status', ['active', 'planning'])
        .limit(10)
      if (data?.length) {
        contextParts.push(`Proyectos activos: ${JSON.stringify(data)}`)
      }
    }

    if (lowerMsg.includes('automatiz') || lowerMsg.includes('workflow') || lowerMsg.includes('n8n')) {
      const { data } = await supabase
        .from('automations')
        .select('name, status, trigger_type, description')
        .eq('status', 'active')
        .limit(10)
      if (data?.length) {
        contextParts.push(`Automatizaciones activas: ${JSON.stringify(data)}`)
      }
    }

    if (lowerMsg.includes('decisi') || lowerMsg.includes('memory') || lowerMsg.includes('memori')) {
      const { data } = await supabase
        .from('decisions_memory')
        .select('decision, context, impact, tags, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data?.length) {
        contextParts.push(`Decisiones recientes: ${JSON.stringify(data)}`)
      }
    }

    if (lowerMsg.includes('métric') || lowerMsg.includes('metric') || lowerMsg.includes('instagram') || lowerMsg.includes('youtube') || lowerMsg.includes('tiktok')) {
      const { data } = await supabase.from('latest_metrics').select('*').single()
      if (data) {
        contextParts.push(`Métricas actuales: ${JSON.stringify(data)}`)
      }
    }

    if (lowerMsg.includes('acción') || lowerMsg.includes('accion') || lowerMsg.includes('log') || lowerMsg.includes('histor')) {
      const { data } = await supabase
        .from('actions_log')
        .select('action_type, description, status, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data?.length) {
        contextParts.push(`Acciones recientes: ${JSON.stringify(data)}`)
      }
    }

    return contextParts.join('\n\n')
  } catch {
    return ''
  }
}
