import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('portal_messages')
    .select('*, clients(name), projects(name)')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.message.includes('portal_messages')) {
      return NextResponse.json({ messages: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}
