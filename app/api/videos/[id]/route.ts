import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('video_jobs')
    .select('*, clients(name), projects(name)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()

  // Cancel job
  if (body.cancel) {
    const { data, error } = await supabase
      .from('video_jobs')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending', 'rendering'])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  }

  // If regenerating: create a new job with updated extra_info
  if (body.regenerate) {
    const { data: original } = await supabase.from('video_jobs').select('*').eq('id', id).single()
    if (!original) return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })

    const { data, error } = await supabase.from('video_jobs').insert({
      client_id: original.client_id,
      project_id: original.project_id,
      template: original.template,
      props: {
        extra_info: body.instructions || '',
        based_on_job: id,
        previous_slides: original.props?.generated_slides || [],
      },
      status: 'pending',
      progress: 0,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ job: data })
  }

  // Regular update
  const { data, error } = await supabase.from('video_jobs').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
