import { createClient } from '@supabase/supabase-js'

export function createVaultServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_VAULT_SUPABASE_URL!,
    process.env.VAULT_SUPABASE_SERVICE_KEY!
  )
}
