import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const form  = await req.formData()
    const audio = form.get('audio') as File | null
    if (!audio) return NextResponse.json({ error: 'Sin audio' }, { status: 400 })

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    const transcription = await groq.audio.transcriptions.create({
      file:     audio,
      model:    'whisper-large-v3',
      language: 'es',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Transcribe error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
