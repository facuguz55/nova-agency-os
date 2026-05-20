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
  const { client_id, project_id, template, format, frames_per_slide, extra_info, brand_colors, has_brand_colors } = body

  if (has_brand_colors !== undefined && brand_colors?.length) {
    await supabase.from('clients').update({
      has_brand_colors,
      ...(brand_colors[0] ? { brand_color1: brand_colors[0] } : {}),
      ...(brand_colors[1] ? { brand_color2: brand_colors[1] } : {}),
    }).eq('id', client_id)
  }

  const { data, error } = await supabase.from('video_jobs').insert({
    client_id,
    project_id: project_id || null,
    template,
    props: {
      extra_info: extra_info || '',
      format: format || 'vertical',
      frames_per_slide: frames_per_slide || 180,
      brand_colors: brand_colors || null,
    },
    status: 'pending',
    progress: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
