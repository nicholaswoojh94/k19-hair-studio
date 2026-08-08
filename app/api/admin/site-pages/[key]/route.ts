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

export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  if (!checkAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = makeAdmin()
  try {
    const { title, content } = await req.json()

    if (!title?.trim() || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await db
      .from('site_pages')
      .upsert(
        { key: params.key, title: title.trim(), content, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select('key, title, content, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ page: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
