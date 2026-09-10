import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NOTIFICATION_LIMIT = 20

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )

  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('admin_notifications')
      .select('id, type, message, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(NOTIFICATION_LIMIT)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const unreadIds = (notifications || []).filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (err) {
    console.error('Admin notifications error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
