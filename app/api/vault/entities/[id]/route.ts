import { NextResponse } from 'next/server'
import { createVaultServerClient } from '@/lib/supabase/vault-server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createVaultServerClient()

  const [entity, personal, financials, credentials, socials] = await Promise.all([
    supabase.from('vault_entities').select('*').eq('id', id).single(),
    supabase.from('vault_personal').select('*').eq('entity_id', id).maybeSingle(),
    supabase.from('vault_financials').select('*').eq('entity_id', id).order('created_at'),
    supabase.from('vault_credentials').select('*').eq('entity_id', id).order('category'),
    supabase.from('vault_social').select('*').eq('entity_id', id).order('platform'),
  ])

  if (entity.error) return NextResponse.json({ error: entity.error.message }, { status: 500 })

  return NextResponse.json({
    ...entity.data,
    personal: personal.data ?? null,
    financials: financials.data ?? [],
    credentials: credentials.data ?? [],
    socials: socials.data ?? [],
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const supabase = createVaultServerClient()
  const { data, error } = await supabase
    .from('vault_entities')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createVaultServerClient()
  const { error } = await supabase.from('vault_entities').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
