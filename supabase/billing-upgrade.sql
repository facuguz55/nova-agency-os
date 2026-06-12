-- ============================================================
-- NOVA AGENCY — Upgrade de Facturación
-- Retainers (ingresos recurrentes) + Gastos + neto mensual
-- Ejecutar en el proyecto principal (oodfcvhslvwjjwxyhpqq)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- RETAINERS / INGRESOS RECURRENTES
-- Definís el fee mensual una vez; cada mes se generan las
-- facturas con un click (idempotente via invoices.recurring_id)
-- ============================================================
create table if not exists recurring_invoices (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references clients(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  amount       numeric not null,
  description  text,
  day_of_month integer not null default 5 check (day_of_month between 1 and 28),
  active       boolean not null default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Vincular facturas generadas con su retainer (idempotencia mensual)
alter table invoices add column if not exists recurring_id uuid references recurring_invoices(id) on delete set null;

create index if not exists idx_recurring_client     on recurring_invoices(client_id);
create index if not exists idx_invoices_recurring   on invoices(recurring_id);

-- ============================================================
-- GASTOS
-- Lo que sale todos los meses: herramientas, ads, freelancers.
-- Neto del mes = cobrado - gastos → split 50/50 sobre el neto.
-- ============================================================
create table if not exists expenses (
  id           uuid primary key default uuid_generate_v4(),
  label        text not null,
  amount       numeric not null,
  category     text not null default 'otro' check (category in ('herramientas', 'publicidad', 'freelance', 'impuestos', 'servicios', 'otro')),
  expense_date date not null default current_date,
  recurring    boolean not null default false,
  notes        text,
  created_at   timestamptz default now()
);

create index if not exists idx_expenses_date on expenses(expense_date);

-- updated_at automático en retainers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_recurring_updated on recurring_invoices;
create trigger trg_recurring_updated
  before update on recurring_invoices
  for each row execute function update_updated_at();

-- RLS igual que el resto de tablas del OS (acceso via service key / authenticated)
alter table recurring_invoices enable row level security;
alter table expenses           enable row level security;

drop policy if exists "authenticated_all_recurring" on recurring_invoices;
create policy "authenticated_all_recurring" on recurring_invoices
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_all_expenses" on expenses;
create policy "authenticated_all_expenses" on expenses
  for all to authenticated using (true) with check (true);
