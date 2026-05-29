export type VaultEntityType = 'facundo' | 'mauricio' | 'agencia' | 'cliente'

export type FinancialType =
  | 'cbu'
  | 'alias'
  | 'cuenta_bancaria'
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'billetera_virtual'
  | 'crypto'
  | 'efectivo'
  | 'otro'

export type CredentialCategory =
  | 'red_social'
  | 'email'
  | 'banco'
  | 'hosting'
  | 'dominio'
  | 'saas'
  | 'tienda'
  | 'gobierno'
  | 'otro'

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'whatsapp_business'
  | 'telegram'
  | 'otro'

export interface VaultEntity {
  id: string
  type: VaultEntityType
  name: string
  avatar_url: string | null
  client_ref_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultPersonal {
  id: string
  entity_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  province: string | null
  country: string | null
  birth_date: string | null
  dni: string | null
  cuit: string | null
  nationality: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultFinancial {
  id: string
  entity_id: string
  type: FinancialType
  label: string
  value: string | null
  bank_name: string | null
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultCredential {
  id: string
  entity_id: string
  category: CredentialCategory
  service_name: string
  service_url: string | null
  username: string | null
  email_used: string | null
  password: string | null
  phone_2fa: string | null
  recovery_email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultSocial {
  id: string
  entity_id: string
  platform: SocialPlatform
  handle: string | null
  url: string | null
  email_used: string | null
  phone_used: string | null
  followers: number | null
  is_verified: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultCustomField {
  id: string
  entity_id: string
  label: string
  value: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VaultEntityFull extends VaultEntity {
  personal: VaultPersonal | null
  financials: VaultFinancial[]
  credentials: VaultCredential[]
  socials: VaultSocial[]
  custom: VaultCustomField[]
}
