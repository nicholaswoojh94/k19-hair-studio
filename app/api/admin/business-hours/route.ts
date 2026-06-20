import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
}

export async function GET() {
  const supabaseAdmin = getAdmin()
  try {
    const { data, error } = await supabaseAdmin
      .from('business_hours')
      .select('*')
      .order('day_of_week', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ hours: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  try {
    const { hours } = await req.json()

    if (!Array.isArray(hours) || hours.length !== 7) {
      return NextResponse.json({ error: 'Expected array of 7 days' }, { status: 400 })
    }

    for (const day of hours) {
      const { error } = await supabaseAdmin
        .from('business_hours')
        .update({
          opening_time: day.opening_time,
          closing_time: day.closing_time,
          is_closed: day.is_closed,
        })
        .eq('day_of_week', day.day_of_week)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
