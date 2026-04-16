import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { client_id } = await req.json()
  if (!client_id) return NextResponse.json({ error: 'client_id requerido' }, { status: 400 })

  const supabase   = await createClient()
  const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const [clientRes, projectsRes, automationsRes, invoicesRes, metricsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', client_id).single(),
    supabase.from('projects').select('*').eq('client_id', client_id),
    supabase.from('automations').select('*').eq('client_id', client_id),
    supabase.from('invoices').select('*').eq('client_id', client_id).order('created_at', { ascending: false }).limit(10),
    supabase.from('latest_metrics').select('*').single(),
  ])

  const client     = clientRes.data
  const projects   = projectsRes.data   || []
  const automations = automationsRes.data || []
  const invoices   = invoicesRes.data   || []
  const metrics    = metricsRes.data

  const totalBilled = invoices.filter(i => i.status === 'paid').reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)
  const pending     = invoices.filter(i => i.status === 'pending').reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)

  const context = `
Cliente: ${client?.name} | Industria: ${client?.industry || 'N/A'} | Estado: ${client?.status}

Proyectos (${projects.length}):
${projects.map(p => `- ${p.name}: ${p.status}${p.budget ? ` ($${p.budget})` : ''}`).join('\n')}

Automatizaciones activas: ${automations.filter(a => a.status === 'active').length}/${automations.length}

Facturación:
- Total cobrado: $${totalBilled.toLocaleString()}
- Pendiente: $${pending.toLocaleString()}
- Facturas: ${invoices.length}

${metrics ? `Métricas agencia:
- Instagram: ${metrics.instagram_followers || 'N/A'} seguidores
- YouTube: ${metrics.youtube_subscribers || 'N/A'} suscriptores
- TikTok: ${metrics.tiktok_followers || 'N/A'} seguidores` : ''}
`

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Generá un reporte ejecutivo profesional para este cliente en español. Debe incluir:
1. Resumen del estado actual
2. Proyectos en curso y avance
3. Automatizaciones activas
4. Situación financiera
5. Recomendaciones o próximos pasos

Datos del cliente:
${context}

El reporte debe ser claro, profesional y útil para presentarle al cliente o usarlo internamente.`,
    }],
  })

  const report = res.content[0].type === 'text' ? res.content[0].text : 'Error generando reporte'

  await supabase.from('actions_log').insert({
    action_type: 'report',
    description: `Reporte generado para: ${client?.name}`,
    status: 'executed', created_by: 'Nova AI',
  })

  return NextResponse.json({ report, client: client?.name })
}
