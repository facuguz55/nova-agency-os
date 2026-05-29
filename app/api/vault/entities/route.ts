import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'
import { requireVaultAuth, isAuthError } from '@/lib/vault-auth'

export async function GET() {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_entities')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const body = await req.json()
  const { type, name, avatar_url, client_ref_id, notes } = body

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_entities')
    .insert({ type, name, avatar_url, client_ref_id, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
