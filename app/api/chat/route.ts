import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithClaude } from '@/lib/claude/client'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado — iniciá sesión de nuevo' }, { status: 401 })
    }

    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
    }

    // Llamar a Claude
    const response = await chatWithClaude(message, history || [], user.id)

    // Guardar en chat_history (no bloquear si falla)
    supabase.from('chat_history').insert({
      user_id: user.id,
      message: message.trim(),
      response,
      metadata: { action_type: 'chat', context: 'ai_response' },
    }).then(({ error }) => {
      if (error) console.warn('chat_history insert warning:', error.message)
    })

    return NextResponse.json({ response })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Chat error:', msg)
    // Devolver el error real para poder debuggear
    return NextResponse.json({ error: `Error: ${msg}` }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ history: [] })

    const url   = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    return NextResponse.json({ history: (data || []).reverse() })
  } catch {
    return NextResponse.json({ history: [] })
  }
}
