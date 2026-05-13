import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase  = await createClient()
  const body      = await req.json()
  const { pin, type, title, body: msgBody, project_id } = body

  const { data: portal } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (!portal || !portal.active)    return NextResponse.json({ error: 'Portal inválido' }, { status: 404 })
  if (portal.pin !== pin)           return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  if (!msgBody?.trim())             return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

  const { error } = await supabase.from('portal_messages').insert({
    client_id:  portal.client_id,
    project_id: project_id || null,
    type,
    title:      title || null,
    body:       msgBody.trim(),
  })

  if (error) {
    if (error.message.includes('portal_messages')) {
      return NextResponse.json({ error: 'Tabla no creada aún' }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
