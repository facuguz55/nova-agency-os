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
    .from('vault_personal')
    .select('*')
    .eq('entity_id', entityId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request, { params }: Params) {
  const auth = await requireVaultAuth()
  if (isAuthError(auth)) return auth

  const { entityId } = await params
  const body = await req.json()
  const {
    full_name, email, phone, whatsapp, address, city,
    province, country, birth_date, dni, cuit, nationality, notes,
  } = body

  const payload = {
    full_name, email, phone, whatsapp, address, city,
    province, country, birth_date, dni, cuit, nationality, notes,
    entity_id: entityId,
  }

  const supabase = createVaultServerClient()
  const { data: existing } = await supabase
    .from('vault_personal')
    .select('id')
    .eq('entity_id', entityId)
    .maybeSingle()

  const result = existing
    ? await supabase.from('vault_personal').update(payload).eq('entity_id', entityId).select().single()
    : await supabase.from('vault_personal').insert(payload).select().single()

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
