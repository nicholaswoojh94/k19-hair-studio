import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { id } = params
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('services')
      .update({
        name_en: body.name_en,
        name_bm: body.name_bm,
        name_zh: body.name_zh,
        duration_minutes: parseInt(body.duration_minutes),
        price_from: body.price_from || null,
        price_to: body.price_to || null,
        is_active: body.is_active,
        sort_order: body.sort_order,
        category: body.category,
        buffer_minutes: body.buffer_minutes ? parseInt(body.buffer_minutes) : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, service: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
