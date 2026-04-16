import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  // Si viene con client_context → personalizar con IA
  if (body.personalize && body.client_context && body.template_body) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Personalizá este template de email para el siguiente cliente. Respondé SOLO con el email personalizado, sin explicaciones.

Template:
${body.template_body}

Contexto del cliente:
${body.client_context}`,
      }],
    })
    const personalized = res.content[0].type === 'text' ? res.content[0].text : body.template_body
    return NextResponse.json({ personalized })
  }

  const { data, error } = await supabase.from('email_templates').insert({
    name:    body.name,
    subject: body.subject,
    body:    body.body,
    type:    body.type || 'general',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
