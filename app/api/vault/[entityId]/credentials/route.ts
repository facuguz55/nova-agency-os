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
    .from('vault_credentials')
    .select('*')
    .eq('entity_id', entityId)
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const body = await req.json()
  const {
    category, service_name, service_url, username,
    email_used, password, phone_2fa, recovery_email, notes,
  } = body

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_credentials')
    .insert({ category, service_name, service_url, username, email_used, password, phone_2fa, recovery_email, notes, entity_id: entityId })
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
  const {
    id, category, service_name, service_url, username,
    email_used, password, phone_2fa, recovery_email, notes,
  } = body

  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_credentials')
    .update({ category, service_name, service_url, username, email_used, password, phone_2fa, recovery_email, notes })
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
    .from('vault_credentials')
    .delete()
    .eq('id', id)
    .eq('entity_id', entityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
