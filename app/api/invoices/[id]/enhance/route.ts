import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, clients(name, email, industry, contact_person)')
    .eq('id', id)
    .single()

  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const client = inv.clients as { name: string; email: string | null; industry: string | null; contact_person: string | null } | null
  const amount = Number(inv.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })

  const prompt = `Sos el área de facturación de Nova Agency, una agencia digital argentina especializada en desarrollo web, automatizaciones con IA y marketing digital.

Tenés que redactar la descripción de servicios para esta factura de manera profesional, detallada y técnica.

DATOS DE LA FACTURA:
- Cliente: ${client?.name || 'Cliente'}${client?.industry ? ` (${client.industry})` : ''}${client?.contact_person ? ` — contacto: ${client.contact_person}` : ''}
- Descripción original: ${inv.description || 'Servicios profesionales'}
- Monto: ARS $ ${amount}
- Estado: ${inv.status}
- Número: ${inv.invoice_number}

INSTRUCCIONES:
1. Expandí la descripción original en 3-5 líneas profesionales y técnicas
2. Mencioná entregables concretos relacionados con el rubro del cliente
3. Incluí referencias a metodología, herramientas o tecnologías cuando corresponda
4. Mantenené un tono formal pero cercano, estilo agencia boutique argentina
5. NO uses viñetas ni markdown — texto corrido, párrafo limpio
6. Máximo 5 líneas, que entre bien en una factura A4

Respondé ÚNICAMENTE con la descripción expandida, sin explicaciones adicionales.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const enhanced = (message.content[0] as { type: string; text: string }).text.trim()

  return NextResponse.json({ enhanced })
}
