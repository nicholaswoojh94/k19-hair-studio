import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ services: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const body = await req.json()
    const { name_en, name_bm, name_zh, duration_minutes, price_from, price_to, sort_order } = body

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({
        name_en, name_bm, name_zh,
        duration_minutes: parseInt(duration_minutes),
        price_from: price_from || null,
        price_to: price_to || null,
        sort_order: sort_order || 99,
        is_active: true,
        category: body.category || 'General',
        buffer_minutes: body.buffer_minutes ? parseInt(body.buffer_minutes) : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, service: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
