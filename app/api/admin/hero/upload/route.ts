import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and WebP images are allowed' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    // Delete old image from storage if one exists
    const { data: pathRow } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'hero_image_path')
      .single()

    if (pathRow?.value) {
      await supabaseAdmin.storage.from('gallery').remove([pathRow.value])
    }

    const ext = file.name.split('.').pop()
    const storagePath = `hero/hero-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from('gallery')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage.from('gallery').getPublicUrl(storagePath)

    await supabaseAdmin.from('admin_settings').upsert(
      { key: 'hero_image_url', value: publicUrl, description: 'Hero section background image URL' },
      { onConflict: 'key' }
    )
    await supabaseAdmin.from('admin_settings').upsert(
      { key: 'hero_image_path', value: storagePath, description: 'Hero section background image storage path' },
      { onConflict: 'key' }
    )

    return NextResponse.json({ success: true, url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
