import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:nova@novaagency.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const { title, body, url } = await req.json()

  const { data: portal } = await supabase
    .from('client_portals')
    .select('client_id')
    .eq('token', token)
    .single()

  if (!portal) return NextResponse.json({ error: 'Portal no encontrado' }, { status: 404 })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('client_id', portal.client_id)

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({ title, body, url: url || `/portal/${token}/inicio` })
  let sent = 0

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      sent++
    } catch {
      // suscripción expirada — eliminar
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
  }))

  return NextResponse.json({ sent })
}
