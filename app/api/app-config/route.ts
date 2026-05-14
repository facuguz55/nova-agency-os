import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('app_config').select('key, value')
  const config: Record<string, string> = {}
  for (const row of data || []) config[row.key] = row.value ?? ''
  return NextResponse.json(config)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body: Record<string, string> = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await supabase.from('app_config').upsert({ key, value, updated_at: new Date().toISOString() })
  }
  return NextResponse.json({ ok: true })
}
