-- ============================================================
-- NOVA AGENCY VAULT — Supabase separado
-- Ejecutar en el proyecto vault de Supabase
--
-- SEGURIDAD:
-- - Acceso solo via service-role key desde API routes autenticadas.
-- - La anon key de este proyecto NUNCA se expone al browser.
-- - Los campos de contraseñas se guardan en texto plano en DB
--   (el cifrado en tránsito lo provee Supabase/TLS). Si se requiere
--   cifrado en reposo, activar pgsodium en Supabase y usar
--   pgsodium.crypto_aead_det_encrypt antes de insertar.
-- ============================================================

-- Extensión para UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENTIDADES (Facundo, Mauricio, Agencia, Clientes)
-- ============================================================
create table if not exists vault_entities (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null check (type in ('facundo', 'mauricio', 'agencia', 'cliente')),
  name          text not null,
  avatar_url    text,
  client_ref_id text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Insertar las 3 entidades fijas
insert into vault_entities (type, name) values
  ('facundo',  'Facundo Guzmán'),
  ('mauricio', 'Mauricio Linquela'),
  ('agencia',  'Nova Agency')
on conflict do nothing;

-- ============================================================
-- DATOS PERSONALES
-- ============================================================
create table if not exists vault_personal (
  id           uuid primary key default uuid_generate_v4(),
  entity_id    uuid not null references vault_entities(id) on delete cascade,
  full_name    text,
  email        text,
  phone        text,
  whatsapp     text,
  address      text,
  city         text,
  province     text,
  country      text default 'Argentina',
  birth_date   date,
  dni          text,
  cuit         text,
  nationality  text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(entity_id)
);

-- ============================================================
-- DATOS FINANCIEROS
-- ============================================================
create table if not exists vault_financials (
  id          uuid primary key default uuid_generate_v4(),
  entity_id   uuid not null references vault_entities(id) on delete cascade,
  type        text not null check (type in ('cbu', 'alias', 'cuenta_bancaria', 'tarjeta_credito', 'tarjeta_debito', 'billetera_virtual', 'crypto', 'efectivo', 'otro')),
  label       text not null,
  value       text,
  bank_name   text,
  currency    text default 'ARS',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- CREDENCIALES Y ACCESOS
-- ============================================================
create table if not exists vault_credentials (
  id             uuid primary key default uuid_generate_v4(),
  entity_id      uuid not null references vault_entities(id) on delete cascade,
  category       text not null check (category in ('red_social', 'email', 'banco', 'hosting', 'dominio', 'saas', 'tienda', 'gobierno', 'otro')),
  service_name   text not null,
  service_url    text,
  username       text,
  email_used     text,
  password       text,
  phone_2fa      text,
  recovery_email text,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ============================================================
-- REDES SOCIALES
-- ============================================================
create table if not exists vault_social (
  id          uuid primary key default uuid_generate_v4(),
  entity_id   uuid not null references vault_entities(id) on delete cascade,
  platform    text not null check (platform in ('instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook', 'whatsapp_business', 'telegram', 'otro')),
  handle      text,
  url         text,
  email_used  text,
  phone_used  text,
  followers   integer,
  is_verified boolean default false,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_vault_financials_entity   on vault_financials(entity_id);
create index if not exists idx_vault_credentials_entity  on vault_credentials(entity_id);
create index if not exists idx_vault_social_entity       on vault_social(entity_id);
create index if not exists idx_vault_personal_entity     on vault_personal(entity_id);
create index if not exists idx_vault_entities_type       on vault_entities(type);

-- ============================================================
-- FUNCIÓN updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vault_entities_updated
  before update on vault_entities
  for each row execute function update_updated_at();

create trigger trg_vault_personal_updated
  before update on vault_personal
  for each row execute function update_updated_at();

create trigger trg_vault_financials_updated
  before update on vault_financials
  for each row execute function update_updated_at();

create trigger trg_vault_credentials_updated
  before update on vault_credentials
  for each row execute function update_updated_at();

create trigger trg_vault_social_updated
  before update on vault_social
  for each row execute function update_updated_at();

-- ============================================================
-- RLS — habilitado y cerrado al público.
-- Solo el service-role key puede acceder (bypasea RLS).
-- La anon key no tiene acceso a ninguna tabla.
-- ============================================================
alter table vault_entities    enable row level security;
alter table vault_personal    enable row level security;
alter table vault_financials  enable row level security;
alter table vault_credentials enable row level security;
alter table vault_social      enable row level security;

-- Sin políticas = acceso denegado para anon y authenticated.
-- El service-role key bypasea RLS desde las API routes.
-- No agregar políticas permisivas aquí.
