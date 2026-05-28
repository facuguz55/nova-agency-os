-- ── TÉRMINOS Y CONDICIONES en client_portals ────────────────
-- Guarda la fecha/hora exacta en que el cliente aceptó los T&C
ALTER TABLE public.client_portals
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;
