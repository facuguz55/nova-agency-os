import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { pin } = await req.json()

  const { data, error } = await supabase
    .from('client_portals')
    .select('id, pin, active')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ ok: false, error: 'Portal no encontrado' }, { status: 404 })
  if (!data.active)   return NextResponse.json({ ok: false, error: 'Portal inactivo' }, { status: 403 })
  if (data.pin !== pin) return NextResponse.json({ ok: false, error: 'PIN incorrecto' }, { status: 401 })

  return NextResponse.json({ ok: true })
}
