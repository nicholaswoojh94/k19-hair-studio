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
      .from('admin_settings')
      .select('key, value, description')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const settings: Record<string, string> = {}
    ;(data || []).forEach((row: { key: string; value: string }) => { settings[row.key] = row.value })
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { updates } = await req.json()

    const promises = updates.map(({ key, value }: { key: string; value: string }) =>
      supabaseAdmin
        .from('admin_settings')
        .update({ value })
        .eq('key', key)
    )

    await Promise.all(promises)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
