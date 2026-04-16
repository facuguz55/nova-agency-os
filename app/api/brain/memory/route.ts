import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase  = await createClient()
    const { searchParams } = req.nextUrl
    const category  = searchParams.get('category')
    const search    = searchParams.get('search')

    let query = supabase
      .from('ai_memory')
      .select('id, category, title, content, tags, confidence, times_applied, source, created_at, updated_at')
      .order('times_applied', { ascending: false })
      .limit(50)

    if (category) query = query.eq('category', category)
    if (search)   query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body     = await req.json()

    const { data, error } = await supabase
      .from('ai_memory')
      .insert({
        category:   body.category   || 'fact',
        title:      body.title,
        content:    body.content,
        tags:       body.tags       || [],
        confidence: body.confidence ?? 50,
        source:     'manual',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
