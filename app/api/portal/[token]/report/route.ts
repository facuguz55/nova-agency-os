import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { pin } = await req.json()
  const supabase = await createClient()

  const { data: portal, error: pErr } = await supabase
    .from('client_portals')
    .select('id, pin, active, client_id')
    .eq('token', token)
    .single()

  if (pErr || !portal)    return NextResponse.json({ error: 'Portal no encontrado' }, { status: 404 })
  if (!portal.active)     return NextResponse.json({ error: 'Portal inactivo' }, { status: 403 })
  if (portal.pin !== pin) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

  const cid = portal.client_id

  const [clientRes, projectsRes, tasksRes, invoicesRes] = await Promise.all([
    supabase.from('clients').select('name,industry,status').eq('id', cid).single(),
    supabase.from('projects').select('name,status,budget').eq('client_id', cid),
    supabase.from('tasks').select('title,status,priority').eq('client_id', cid),
    supabase.from('invoices').select('amount,status').eq('client_id', cid),
  ])

  const client = clientRes.data
  const projects = projectsRes.data || []
  const tasks = tasksRes.data || []
  const invoices = invoicesRes.data || []

  const totalFacturado = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const tareasCompletadas = tasks.filter(t => t.status === 'done').length

  const prompt = `Generá un reporte mensual ejecutivo para el cliente "${client?.name}" de la agencia Nova Agency.

Contexto:
- Industria: ${client?.industry || 'No especificada'}
- Proyectos activos: ${projects.filter(p => p.status === 'active').length}/${projects.length}
- Tareas completadas este período: ${tareasCompletadas}/${tasks.length}
- Total facturado y pagado: $${totalFacturado.toLocaleString()}

Generá el reporte en formato texto plano con secciones:
1. Resumen ejecutivo (2-3 oraciones)
2. Logros del período (lista de 3-4 puntos)
3. Trabajo en progreso (lista de 2-3 puntos)
4. Próximos pasos (lista de 2-3 puntos)
5. Cierre motivador (1 párrafo breve)

Tono: profesional pero cálido, en español rioplatense. Longitud: 300-400 palabras.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = (msg.content[0] as { text: string }).text
  const period = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const title = `Reporte ${period} — ${client?.name}`

  const { data: report, error: rErr } = await supabase
    .from('portal_reports')
    .insert({ portal_id: portal.id, client_id: cid, title, content, period })
    .select()
    .single()

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })
  return NextResponse.json({ report })
}
