import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('video_jobs')
    .select('*, clients(name), projects(name)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data || [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { client_id, project_id, template, format, extra_info, brand_color1, brand_color2, has_brand_colors } = body

  // Update brand colors on client if provided
  if (has_brand_colors !== undefined) {
    await supabase.from('clients').update({
      has_brand_colors,
      ...(brand_color1 ? { brand_color1 } : {}),
      ...(brand_color2 ? { brand_color2 } : {}),
    }).eq('id', client_id)
  }

  const { data, error } = await supabase.from('video_jobs').insert({
    client_id,
    project_id: project_id || null,
    template,
    format: format || 'vertical',
    props: { extra_info: extra_info || '' },
    status: 'pending',
    progress: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
