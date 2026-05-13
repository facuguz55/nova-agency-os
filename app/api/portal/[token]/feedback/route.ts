import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const { pin, project_id, vote } = await req.json()

  const { data: portal } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (!portal || !portal.active) return NextResponse.json({ error: 'Portal inválido' }, { status: 404 })
  if (portal.pin !== pin)        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  if (!['up', 'down'].includes(vote)) return NextResponse.json({ error: 'Voto inválido' }, { status: 400 })

  const { error } = await supabase.from('portal_feedback').upsert(
    { project_id, client_id: portal.client_id, vote },
    { onConflict: 'project_id,client_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
