import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrics_instagram')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  // Si hay token de Instagram, intentar fetch real
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (token && body.fetch_live) {
    try {
      const res = await fetch(
        `https://graph.instagram.com/me?fields=followers_count,media_count&access_token=${token}`
      )
      const igData = await res.json()
      if (igData.followers_count) {
        const { data } = await supabase.from('metrics_instagram').insert({
          followers: igData.followers_count,
          engagement_rate: null,
          top_post: null,
          top_post_likes: null,
        }).select().single()
        return NextResponse.json({ metric: data, source: 'live' })
      }
    } catch (e) {
      console.error('Instagram API error:', e)
    }
  }

  // Guardar datos manuales
  const { data, error } = await supabase.from('metrics_instagram').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'api_call',
    description: 'Métricas de Instagram actualizadas',
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ metric: data, source: 'manual' })
}
