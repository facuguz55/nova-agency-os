import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada en Vercel' }, { status: 500 })
  }

  try {
    const form  = await req.formData()
    const audio = form.get('audio') as File | null

    if (!audio)           return NextResponse.json({ error: 'Sin audio' }, { status: 400 })
    if (audio.size < 500) return NextResponse.json({ error: 'Audio demasiado corto' }, { status: 400 })

    console.log('Transcribe:', audio.name, audio.type, audio.size, 'bytes')

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const transcription = await groq.audio.transcriptions.create({
      file:     audio,
      model:    'whisper-large-v3',
      language: 'es',
    })

    const text = transcription.text?.trim()
    console.log('Transcription result:', text)

    return NextResponse.json({ text: text || '' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Transcribe error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
