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

// GET — return all service duration overrides for this customer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = makeAdmin()
  const { data, error } = await db
    .from('customer_service_durations')
    .select('id, service_id, duration_minutes, updated_at')
    .eq('customer_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ overrides: data || [] })
}

// PUT — upsert or delete one override
// body: { serviceId, durationMinutes } — if durationMinutes is null/0, delete the row
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { serviceId, durationMinutes } = await req.json()
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 })

  const db = makeAdmin()

  if (!durationMinutes || durationMinutes <= 0) {
    // Delete the override — treat blank/zero as "remove override"
    const { error } = await db
      .from('customer_service_durations')
      .delete()
      .eq('customer_id', params.id)
      .eq('service_id', serviceId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'deleted' })
  }

  const { data, error } = await db
    .from('customer_service_durations')
    .upsert(
      {
        customer_id: params.id,
        service_id: serviceId,
        duration_minutes: durationMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id,service_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, override: data })
}
