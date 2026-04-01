import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrics_tiktok')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('metrics_tiktok').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'api_call',
    description: 'Métricas de TikTok actualizadas',
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ metric: data, source: 'manual' })
}
