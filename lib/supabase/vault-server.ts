import { createClient } from '@supabase/supabase-js'

export function createVaultServerClient() {
  // Usar env vars específicas del vault si existen, sino fallback al Supabase principal
  const url = process.env.NEXT_PUBLIC_VAULT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.VAULT_SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}
