import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

function checkAdminSession(req: NextRequest): boolean {
  const cookie = req.cookies.get('k19_admin_session')
  if (!cookie?.value) return false
  try {
    const session = JSON.parse(cookie.value)
    return !!(session.id && session.expires && Date.now() < session.expires)
  } catch {
    return false
  }
}

function generateToken(): string {
  const buf = new Uint8Array(24)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: NextRequest) {
  if (!checkAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = makeAdmin()
  const newToken = generateToken()

  const { error } = await db
    .from('admin_settings')
    .upsert(
      { key: 'calendar_feed_token', value: newToken, description: 'Secret token for iCalendar feed authentication' },
      { onConflict: 'key' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, token: newToken })
}
