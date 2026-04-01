import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrics_youtube')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey && body.channel_id && body.fetch_live) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${body.channel_id}&key=${apiKey}`
      )
      const ytData = await res.json()
      const stats = ytData.items?.[0]?.statistics
      if (stats) {
        const { data } = await supabase.from('metrics_youtube').insert({
          subscribers: parseInt(stats.subscriberCount || '0'),
          views: parseInt(stats.viewCount || '0'),
          avg_watch_time_minutes: null,
        }).select().single()
        return NextResponse.json({ metric: data, source: 'live' })
      }
    } catch (e) {
      console.error('YouTube API error:', e)
    }
  }

  const { data, error } = await supabase.from('metrics_youtube').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('actions_log').insert({
    action_type: 'api_call',
    description: 'Métricas de YouTube actualizadas',
    status: 'executed',
    created_by: 'Sistema',
  })

  return NextResponse.json({ metric: data, source: 'manual' })
}
