import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${id}/photo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('client-assets')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('client-assets').getPublicUrl(path)

  await supabase.from('clients').update({ photo_url: publicUrl }).eq('id', id)

  return NextResponse.json({ photo_url: publicUrl })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    await supabase.storage.from('client-assets').remove([`${id}/photo.${ext}`])
  }

  await supabase.from('clients').update({ photo_url: null }).eq('id', id)
  return NextResponse.json({ success: true })
}
