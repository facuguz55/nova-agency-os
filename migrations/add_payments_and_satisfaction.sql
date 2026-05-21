-- ─────────────────────────────────────────────────────────────────
-- MIGRACIÓN: Pagos parciales + satisfacción del portal
-- Ejecutar en Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1. Tabla de pagos parciales de facturas
CREATE TABLE IF NOT EXISTS invoice_payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount       NUMERIC NOT NULL,
  paid_at      DATE DEFAULT CURRENT_DATE,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar rápido por factura
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- 2. Tabla de satisfacción del portal (reemplaza el viejo vote up/down)
CREATE TABLE IF NOT EXISTS portal_satisfaction (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID,
  client_id   UUID,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment     TEXT,
  phrases     TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_satisfaction_client ON portal_satisfaction(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_satisfaction_project ON portal_satisfaction(project_id);
