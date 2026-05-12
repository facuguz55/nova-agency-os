import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: client },
    { data: projects },
    { data: tasks },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('projects').select('name, status, budget, created_at').eq('client_id', id),
    supabase.from('tasks').select('title, status, priority, due_date, updated_at').eq('client_id', id).order('updated_at', { ascending: false }).limit(20),
    supabase.from('invoices').select('amount, status, due_date, paid_at, created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const totalInvoiced = invoices?.reduce((s, i) => s + Number(i.amount), 0) || 0
  const totalPaid     = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0) || 0
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0
  const activeTasks   = tasks?.filter(t => t.status !== 'done').length || 0
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  const lastTaskUpdate = tasks?.[0]?.updated_at ? new Date(tasks[0].updated_at) : null
  const daysSinceActivity = lastTaskUpdate
    ? Math.floor((Date.now() - lastTaskUpdate.getTime()) / 86400000)
    : 999

  const prompt = `Sos un analista de agencias digitales. Analizá la salud de este cliente y devolvé un JSON con esta estructura exacta:
{
  "score": <número del 1 al 10>,
  "nivel": "<Excelente|Bueno|Regular|En riesgo|Crítico>",
  "resumen": "<2-3 oraciones en español sobre el estado del cliente>",
  "fortalezas": ["<punto 1>", "<punto 2>"],
  "riesgos": ["<riesgo 1>", "<riesgo 2>"],
  "acciones": ["<acción recomendada 1>", "<acción recomendada 2>"]
}

Datos del cliente:
- Nombre: ${client.name}
- Industria: ${client.industry || 'No especificada'}
- Estado: ${client.status}
- Días sin actividad: ${daysSinceActivity === 999 ? 'Sin actividad registrada' : daysSinceActivity + ' días'}
- Proyectos activos: ${activeProjects} (total: ${projects?.length || 0})
- Tareas pendientes: ${activeTasks} (total: ${tasks?.length || 0})
- Facturas vencidas: ${overdueInvoices}
- Total facturado: $${totalInvoiced.toLocaleString()}
- Total cobrado: $${totalPaid.toLocaleString()}
- Tasa de cobro: ${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%

Respondé SOLO con el JSON, sin texto adicional.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const scorecard = JSON.parse(jsonMatch?.[0] || '{}')
    return NextResponse.json({ scorecard })
  } catch {
    return NextResponse.json({ error: 'Error parseando scorecard' }, { status: 500 })
  }
}
