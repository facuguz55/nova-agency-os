import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposals')
    .select('*, clients(name, industry, notes, email)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proposals: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  // Generación con IA
  if (body.generate) {
    const { client_id, service, budget } = body

    // Buscar cliente
    const { data: client } = await supabase
      .from('clients')
      .select('name, industry, notes, email')
      .eq('id', client_id)
      .single()

    const clientName     = client?.name     || 'el cliente'
    const clientIndustry = client?.industry || 'su industria'

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Sos un experto en marketing digital y redactás propuestas comerciales profesionales para agencias.

Redactá una propuesta comercial completa y profesional en español rioplatense para el siguiente cliente:

- Cliente: ${clientName}
- Industria: ${clientIndustry}
- Servicio solicitado: ${service}
- Presupuesto estimado: ${budget ? `$${budget}` : 'a definir'}
${client?.notes ? `- Contexto adicional: ${client.notes}` : ''}

La propuesta debe incluir:
1. Resumen ejecutivo
2. Descripción del servicio propuesto
3. Metodología y entregables
4. Cronograma estimado
5. Inversión y condiciones
6. Por qué Nova Agency

Respondé SOLO con el cuerpo de la propuesta, sin comentarios adicionales. Usá formato claro con secciones bien definidas.`,
      }],
    })

    const content = res.content[0].type === 'text' ? res.content[0].text : ''
    const title   = `Propuesta ${service} — ${clientName}`

    const { data, error } = await supabase.from('proposals').insert({
      title,
      client_id: client_id || null,
      amount:    budget    || null,
      status:    'draft',
      content,
      service,
    }).select('*, clients(name, industry, notes, email)').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('actions_log').insert({
      action_type: 'other',
      description: `Propuesta generada con IA: ${title}`,
      status: 'executed', created_by: 'Sistema',
    })

    return NextResponse.json({ proposal: data })
  }

  // Creación manual
  const { data, error } = await supabase.from('proposals').insert({
    title:     body.title,
    client_id: body.client_id || null,
    amount:    body.amount    || null,
    status:    'draft',
    content:   body.content  || null,
    service:   body.service  || null,
  }).select('*, clients(name, industry, notes, email)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ proposal: data })
}
