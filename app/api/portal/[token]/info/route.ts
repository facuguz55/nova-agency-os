import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_portals')
    .select('pin, active, clients(name, industry)')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!data.active)   return NextResponse.json({ error: 'Inactivo' }, { status: 403 })

  const clients = data.clients as { name: string; industry: string | null } | { name: string; industry: string | null }[] | null
  const client  = Array.isArray(clients) ? clients[0] : clients

  return NextResponse.json({
    pin:    data.pin,
    client: { name: client?.name ?? '', industry: client?.industry ?? null },
  })
}
