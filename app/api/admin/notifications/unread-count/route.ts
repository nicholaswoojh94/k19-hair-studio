import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )

  try {
    const { count, error } = await supabaseAdmin
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (err) {
    console.error('Admin notifications unread-count error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
