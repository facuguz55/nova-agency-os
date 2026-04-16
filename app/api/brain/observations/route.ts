import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const resolved = req.nextUrl.searchParams.get('resolved')

    let query = supabase
      .from('ai_observations')
      .select('id, type, title, content, severity, resolved, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (resolved !== null) query = query.eq('resolved', resolved === 'true')

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
