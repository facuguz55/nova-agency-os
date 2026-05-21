import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const { pin, project_id, rating, comment, phrases } = await req.json()

  const { data: portal } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (!portal || !portal.active) return NextResponse.json({ error: 'Portal inválido' }, { status: 404 })
  if (portal.pin !== pin)        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 10) {
    return NextResponse.json({ error: 'Rating inválido (1–10)' }, { status: 400 })
  }

  const { error } = await supabase.from('portal_satisfaction').upsert(
    {
      project_id:  project_id || null,
      client_id:   portal.client_id,
      rating,
      comment:     comment   || null,
      phrases:     phrases?.length ? phrases : null,
      updated_at:  new Date().toISOString(),
    },
    { onConflict: 'project_id,client_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// GET — devuelve el rating actual para un proyecto
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const { searchParams } = new URL(req.url)
  const pin        = searchParams.get('pin')
  const project_id = searchParams.get('project_id')

  const { data: portal } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (!portal || !portal.active) return NextResponse.json({ error: 'Portal inválido' }, { status: 404 })
  if (portal.pin !== pin)        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  const query = supabase
    .from('portal_satisfaction')
    .select('rating, comment, phrases, updated_at')
    .eq('client_id', portal.client_id)

  if (project_id) query.eq('project_id', project_id)
  else query.is('project_id', null)

  const { data } = await query.maybeSingle()
  return NextResponse.json({ satisfaction: data ?? null })
}
