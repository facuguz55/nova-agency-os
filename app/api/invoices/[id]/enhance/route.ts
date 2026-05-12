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

  const prompt = `Sos el área de facturación de Nova Agency, agencia digital argentina especializada en desarrollo web, automatizaciones con IA y marketing digital.

Generá la descripción estructurada de servicios para esta factura.

DATOS:
- Cliente: ${client?.name || 'Cliente'}${client?.industry ? ` (${client.industry})` : ''}${client?.contact_person ? ` — contacto: ${client.contact_person}` : ''}
- Descripción original: ${inv.description || 'Servicios profesionales'}
- Monto: ARS $ ${amount}
- Número de factura: ${inv.invoice_number}

Respondé ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones, con esta estructura exacta:
{
  "titulo": "Título corto del servicio (máx 6 palabras)",
  "resumen": "Una oración que describe el alcance general del trabajo (máx 20 palabras)",
  "entregables": ["entregable 1", "entregable 2", "entregable 3", "entregable 4"],
  "periodo": "Período o modalidad de prestación (ej: Mayo 2025 · Proyecto puntual)",
  "nota": "Breve nota técnica o metodológica (máx 15 palabras, opcional, puede ser null)"
}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  let structured
  try {
    structured = JSON.parse(raw)
  } catch {
    structured = { titulo: inv.description || 'Servicios profesionales', resumen: raw, entregables: [], periodo: null, nota: null }
  }

  return NextResponse.json({ structured })
}
