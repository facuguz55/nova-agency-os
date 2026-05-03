import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StoredItem } from '@/lib/sidebar-config'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] }, { status: 401 })

  const { data } = await supabase
    .from('sidebar_config')
    .select('items')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ items: data?.items ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items }: { items: StoredItem[] } = await req.json()

  await supabase.from('sidebar_config').upsert(
    { user_id: user.id, items, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )

  return NextResponse.json({ ok: true })
}
