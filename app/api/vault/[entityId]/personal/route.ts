import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'

type Params = { params: Promise<{ entityId: string }> }

export async function GET(_req: Request, { params }: Params) {
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
  const { entityId } = await params
  const body = await req.json()
  const supabase = createVaultServerClient()

  const { data: existing } = await supabase
    .from('vault_personal')
    .select('id')
    .eq('entity_id', entityId)
    .maybeSingle()

  let result
  if (existing) {
    result = await supabase
      .from('vault_personal')
      .update({ ...body, entity_id: entityId })
      .eq('entity_id', entityId)
      .select()
      .single()
  } else {
    result = await supabase
      .from('vault_personal')
      .insert({ ...body, entity_id: entityId })
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
