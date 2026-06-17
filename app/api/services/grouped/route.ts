import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('id, name_en, name_bm, name_zh, category, duration_minutes, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const categoryOrder = ['Haircut', 'Wash', 'Chemical', 'Treatment']
    const grouped: Record<string, any[]> = {}
    categoryOrder.forEach(cat => { grouped[cat] = [] })

    ;(services || []).forEach((s: any) => {
      if (grouped[s.category]) grouped[s.category].push(s)
      else grouped[s.category] = [s]
    })

    return NextResponse.json({ grouped, categoryOrder })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
