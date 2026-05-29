import { createBrowserClient } from '@supabase/ssr'

export function createVaultClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_VAULT_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_VAULT_SUPABASE_ANON_KEY!
  )
}
