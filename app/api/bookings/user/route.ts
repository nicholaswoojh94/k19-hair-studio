import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        notes,
        created_at,
        services (
          id,
          name_en,
          name_bm,
          name_zh,
          duration_minutes,
          price_from,
          price_to
        )
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (error) {
      console.error('Fetch bookings error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings })

  } catch (err) {
    console.error('User bookings error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
