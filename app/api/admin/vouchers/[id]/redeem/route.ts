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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = makeAdmin()
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))
    const bookingId: string | null = body.bookingId ?? null

    const { data: current } = await db
      .from('vouchers')
      .select('id, is_used, expires_at')
      .eq('id', id)
      .single()

    if (!current) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    if (current.is_used) return NextResponse.json({ error: 'Voucher already redeemed' }, { status: 409 })
    if (current.expires_at && new Date(current.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 409 })
    }

    const update: Record<string, unknown> = {
      is_used: true,
      used_at: new Date().toISOString(),
    }
    if (bookingId) update.used_in_booking_id = bookingId

    const { data, error } = await db
      .from('vouchers')
      .update(update)
      .eq('id', id)
      .select('*, services(name_en)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, voucher: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
