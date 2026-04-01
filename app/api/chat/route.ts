import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithClaude } from '@/lib/claude/client'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }

    const response = await chatWithClaude(message, history || [], user.id)

    // Guardar en chat_history
    await supabase.from('chat_history').insert({
      user_id: user.id,
      message: message.trim(),
      response,
      metadata: { action_type: 'chat', context: 'ai_response' },
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const { data } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(limit)

  return NextResponse.json({ history: (data || []).reverse() })
}
