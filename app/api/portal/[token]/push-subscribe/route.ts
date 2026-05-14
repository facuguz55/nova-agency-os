import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const body      = await req.json()
  const { pin, subscription } = body

  const { data: portal } = await supabase
    .from('client_portals')
    .select('id, pin, client_id')
    .eq('token', token)
    .single()

  if (!portal || portal.pin !== pin)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { endpoint, keys } = subscription
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { client_id: portal.client_id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'client_id,endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
