import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/utils'

export async function GET(req: Request) {
  const supabase = await createClient()
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabase
    .from('actions_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('action_type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ actions: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data: action, error } = await supabase
    .from('actions_log')
    .insert({
      action_type: body.action_type,
      description: body.description,
      status: body.risk_level === 'HIGH' ? 'pending' : 'pending',
      created_by: body.created_by || 'AI Assistant',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Para acciones HIGH: crear email de confirmación
  if (body.risk_level === 'HIGH') {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('email_confirmations').insert({
      action_id: action.id,
      token,
      expires_at: expiresAt,
    })

    // En producción: enviar email con el link de confirmación
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm/${token}`

    return NextResponse.json({
      action,
      requires_confirmation: true,
      confirm_url: confirmUrl,
      message: `Acción de alto riesgo. Se enviará email de confirmación a los aprobadores.`,
    })
  }

  return NextResponse.json({ action, requires_confirmation: false })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { id, status, result } = await req.json()

  const { data, error } = await supabase
    .from('actions_log')
    .update({ status, result })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: data })
}
