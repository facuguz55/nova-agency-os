import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_portals')
    .select('*')
    .eq('client_id', id)
    .eq('active', true)
    .single()
  if (error) return NextResponse.json({ portal: null })
  return NextResponse.json({ portal: data })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Generar PIN de 4 dígitos
  const pin = String(Math.floor(1000 + Math.random() * 9000))

  const { data, error } = await supabase
    .from('client_portals')
    .insert({ client_id: id, pin })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ portal: data })
}
