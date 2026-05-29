import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireVaultAuth(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { userId: user.id }
}

export function isAuthError(v: unknown): v is NextResponse {
  return v instanceof NextResponse
}
