import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'

export async function GET() {
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_entities')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_entities')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
