import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — devuelve ratings por cliente + promedio global
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('portal_satisfaction')
    .select('client_id, project_id, rating, comment, phrases, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data || []

  // Agrupar por client_id → promedio + cantidad + última fecha
  const byClient: Record<string, { ratings: number[]; latest: string }> = {}
  for (const r of rows) {
    if (!r.client_id) continue
    if (!byClient[r.client_id]) byClient[r.client_id] = { ratings: [], latest: r.updated_at }
    byClient[r.client_id].ratings.push(Number(r.rating))
  }

  const perClient: Record<string, { avg: number; count: number; latest: string }> = {}
  for (const [cid, v] of Object.entries(byClient)) {
    const avg = v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length
    perClient[cid] = { avg: Math.round(avg * 10) / 10, count: v.ratings.length, latest: v.latest }
  }

  const allRatings = rows.map(r => Number(r.rating))
  const globalAvg = allRatings.length
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
    : null

  return NextResponse.json({ perClient, globalAvg, totalCount: allRatings.length })
}
