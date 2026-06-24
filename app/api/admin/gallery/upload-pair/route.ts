import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_SIZE = 5 * 1024 * 1024

async function uploadFile(
  supabase: any,
  file: File,
  prefix: string
): Promise<{ publicUrl: string; storagePath: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Only JPG, PNG and WebP images are allowed')
  if (file.size > MAX_SIZE) throw new Error('File size must be under 5MB')

  const ext = file.name.split('.').pop()
  const storagePath = `photos/${prefix}-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('gallery')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(storagePath)
  return { publicUrl, storagePath }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const formData = await req.formData()
    const beforeFile = formData.get('before') as File
    const afterFile  = formData.get('after')  as File
    const caption    = (formData.get('caption') as string) || ''

    if (!beforeFile || !afterFile) {
      return NextResponse.json({ error: 'Both before and after images are required' }, { status: 400 })
    }

    const [before, after] = await Promise.all([
      uploadFile(supabaseAdmin, beforeFile, 'before'),
      uploadFile(supabaseAdmin, afterFile,  'after'),
    ])

    const { data: existing } = await supabaseAdmin
      .from('gallery_photos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existing?.length ? existing[0].sort_order + 1 : 0

    const { data: photo, error: dbError } = await supabaseAdmin
      .from('gallery_photos')
      .insert({
        url: before.publicUrl,
        storage_path: before.storagePath,
        after_image_url: after.publicUrl,
        after_storage_path: after.storagePath,
        caption: caption || null,
        sort_order: nextSortOrder,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ success: true, photo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
