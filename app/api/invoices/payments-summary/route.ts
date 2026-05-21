import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — devuelve un mapa { invoice_id → total_pagado } para todas las facturas
// Usado en el listado de facturas para mostrar la barra de progreso de pago
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoice_payments')
    .select('invoice_id, amount')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupar por invoice_id
  const sums: Record<string, number> = {}
  for (const row of data || []) {
    sums[row.invoice_id] = (sums[row.invoice_id] || 0) + Number(row.amount)
  }

  return NextResponse.json({ sums })
}
