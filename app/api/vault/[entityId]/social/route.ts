import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'

type Params = { params: Promise<{ entityId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { entityId } = await params
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_social')
    .select('*')
    .eq('entity_id', entityId)
    .order('platform')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: Params) {
  const { entityId } = await params
  const body = await req.json()
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_social')
    .insert({ ...body, entity_id: entityId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: Params) {
  const { entityId } = await params
  const { id, ...body } = await req.json()
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_social')
    .update(body)
    .eq('id', id)
    .eq('entity_id', entityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: Params) {
  const { entityId } = await params
  const { id } = await req.json()
  const supabase = createVaultServerClient()
  const { error } = await supabase
    .from('vault_social')
    .delete()
    .eq('id', id)
    .eq('entity_id', entityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
