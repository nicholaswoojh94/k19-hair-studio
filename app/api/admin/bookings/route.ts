import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'upcoming'
    const date = searchParams.get('date')

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        end_time,
        status,
        notes,
        cancelled_by,
        created_at,
        users (
          id,
          name,
          phone,
          email
        ),
        services (
          id,
          name_en,
          duration_minutes,
          price_from,
          price_to
        )
      `)

    const today = new Date().toISOString().split('T')[0]

    if (date) {
      query = query.eq('booking_date', date)
    } else if (filter === 'today') {
      query = query.eq('booking_date', today)
    } else if (filter === 'upcoming') {
      query = query
        .gte('booking_date', today)
        .eq('status', 'confirmed')
    } else if (filter === 'all') {
      query = query.order('booking_date', { ascending: false })
    }

    const { data: bookings, error } = await query
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings })

  } catch (err) {
    console.error('Admin bookings error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
