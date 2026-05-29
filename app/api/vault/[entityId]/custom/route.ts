import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'
import { requireVaultAuth, isAuthError } from '@/lib/vault-auth'

type Params = { params: Promise<{ entityId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_custom')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const body = await req.json()
  const { label, value, notes } = body

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_custom')
    .insert({ label, value, notes, entity_id: entityId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const body = await req.json()
  const { id, label, value, notes } = body

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_custom')
    .update({ label, value, notes })
    .eq('id', id)
    .eq('entity_id', entityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const { id } = await req.json()
  const supabase = createVaultServerClient()
  const { error } = await supabase
    .from('vault_custom')
    .delete()
    .eq('id', id)
    .eq('entity_id', entityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
