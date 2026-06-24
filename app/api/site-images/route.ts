import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const IMAGE_KEYS = [
  'hero_image_url',
  'service_image_cuts_url',
  'service_image_wash_url',
  'service_image_colour_url',
  'service_image_treatments_url',
]

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )

  try {
    const { data } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .in('key', IMAGE_KEYS)

    const images: Record<string, string | null> = {}
    IMAGE_KEYS.forEach(k => { images[k] = null })
    ;(data || []).forEach((row: { key: string; value: string }) => { images[row.key] = row.value })

    return NextResponse.json({ images })
  } catch {
    return NextResponse.json({ images: Object.fromEntries(IMAGE_KEYS.map(k => [k, null])) })
  }
}
