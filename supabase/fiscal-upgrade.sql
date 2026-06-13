-- ============================================================
-- NOVA AGENCY — Upgrade Fiscal (Factura C / Monotributo)
-- Datos fiscales del receptor (clients) + del comprobante (invoices)
-- Formato fiscal SIN integración AFIP/ARCA — CAE manual opcional.
-- Ejecutar en el proyecto principal (oodfcvhslvwjjwxyhpqq)
-- ============================================================

-- ── CLIENTS: datos fiscales del receptor ─────────────────────
alter table public.clients add column if not exists legal_name     text;  -- Razón social (si difiere del nombre comercial)
alter table public.clients add column if not exists tax_id         text;  -- CUIT / CUIL / DNI
alter table public.clients add column if not exists tax_condition  text    -- Condición frente al IVA
  default 'Consumidor Final';
alter table public.clients add column if not exists fiscal_address text;  -- Domicilio fiscal

-- ── INVOICES: datos del comprobante ──────────────────────────
-- comprobante_tipo: A / B / C / X (X = documento no fiscal / remito interno)
alter table public.invoices add column if not exists comprobante_tipo text
  not null default 'C' check (comprobante_tipo in ('A','B','C','X'));
alter table public.invoices add column if not exists punto_venta text;     -- ej '00001' (default toma el de company.ts)
alter table public.invoices add column if not exists cae         text;     -- CAE (carga manual, opcional)
alter table public.invoices add column if not exists cae_vto     date;     -- Vencimiento del CAE (opcional)

-- Comentarios de documentación
comment on column public.clients.tax_condition is 'Consumidor Final | Monotributo | Responsable Inscripto | Exento | No Categorizado';
comment on column public.invoices.comprobante_tipo is 'C = Monotributo (default). A/B = Responsable Inscripto. X = no fiscal.';
