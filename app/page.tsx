import { createClient } from '@supabase/supabase-js'
import HomeClient from './home-client'

const IMAGE_KEYS = [
  'hero_image_url',
  'service_image_cuts_url',
  'service_image_wash_url',
  'service_image_colour_url',
  'service_image_treatments_url',
]

export default async function HomePage() {
  let siteImages: Record<string, string | null> = Object.fromEntries(IMAGE_KEYS.map(k => [k, null]))

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
    )
    const { data } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', IMAGE_KEYS)

    ;(data || []).forEach((row: { key: string; value: string }) => { siteImages[row.key] = row.value })
  } catch {
    // fall through — HomeClient renders fine with all-null images (uses fallbacks)
  }

  return <HomeClient initialSiteImages={siteImages} />
}
