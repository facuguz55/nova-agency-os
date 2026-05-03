-- ============================================================
-- Nova Agency OS — Tablas nuevas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── TASKS ───────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'todo'
                check (status in ('todo','in_progress','done','blocked')),
  priority    text not null default 'medium'
                check (priority in ('low','medium','high','urgent')),
  assigned_to text,
  project_id  uuid references public.projects(id) on delete set null,
  client_id   uuid references public.clients(id)  on delete set null,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_status_idx    on public.tasks(status);
create index if not exists tasks_project_idx   on public.tasks(project_id);
create index if not exists tasks_client_idx    on public.tasks(client_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── NOTES ───────────────────────────────────────────────────
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  project_id  uuid references public.projects(id) on delete set null,
  client_id   uuid references public.clients(id)  on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_project_idx on public.notes(project_id);
create index if not exists notes_client_idx  on public.notes(client_id);

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ── INVOICES ────────────────────────────────────────────────
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id      uuid references public.clients(id) on delete set null,
  amount         numeric(12,2) not null,
  status         text not null default 'pending'
                   check (status in ('draft','pending','paid','overdue','canceled')),
  description    text,
  due_date       date,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists invoices_client_idx on public.invoices(client_id);
create index if not exists invoices_status_idx on public.invoices(status);

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ── EMAIL TEMPLATES ─────────────────────────────────────────
create table if not exists public.email_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  subject    text not null,
  body       text not null,
  type       text not null default 'general'
               check (type in ('general','onboarding','seguimiento','propuesta','reporte','cobranza')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists email_templates_updated_at on public.email_templates;
create trigger email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ── PROPOSALS ──────────────────────────────────────────────
create table if not exists public.proposals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  client_id   uuid references public.clients(id) on delete set null,
  amount      numeric(12,2),
  status      text not null default 'draft'
                check (status in ('draft','sent','accepted','rejected')),
  content     text,
  service     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists proposals_updated_at on public.proposals;
create trigger proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

-- ── AI MEMORY ──────────────────────────────────────────────
create table if not exists public.ai_memory (
  id            uuid primary key default gen_random_uuid(),
  category      text not null default 'general'
                  check (category in ('pattern','decision','lesson','observation','fact')),
  title         text not null,
  content       text not null,
  tags          text[] default '{}',
  confidence    int default 50 check (confidence between 0 and 100),
  times_applied int default 0,
  source        text default 'chat',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists ai_memory_updated_at on public.ai_memory;
create trigger ai_memory_updated_at
  before update on public.ai_memory
  for each row execute function public.set_updated_at();

-- ── SIDEBAR CONFIG ──────────────────────────────────────────
create table if not exists public.sidebar_config (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade unique,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── AI OBSERVATIONS ─────────────────────────────────────────
create table if not exists public.ai_observations (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('alert','pattern','insight','recommendation')),
  title       text not null,
  content     text not null,
  severity    text default 'info' check (severity in ('info','warning','critical')),
  resolved    boolean default false,
  created_at  timestamptz not null default now()
);
