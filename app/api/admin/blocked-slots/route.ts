import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let query = supabaseAdmin
      .from('blocked_slots')
      .select('*')
      .order('block_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('block_date', date)
    } else if (month && year) {
      const start = `${year}-${String(month).padStart(2,'0')}-01`
      const end = new Date(parseInt(year), parseInt(month), 0)
        .toISOString().split('T')[0]
      query = query.gte('block_date', start).lte('block_date', end)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ blocks: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { blockDate, startTime, endTime, isFullDay, reason } = await req.json()

    if (!blockDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Check for existing confirmed bookings that conflict
    const bookingQuery = supabaseAdmin
      .from('bookings')
      .select('id, booking_time, end_time, users(name)')
      .eq('booking_date', blockDate)
      .eq('status', 'confirmed')

    const { data: existingBookings } = await bookingQuery

    if (existingBookings && existingBookings.length > 0) {
      if (isFullDay) {
        // Full day block — any confirmed booking on this date blocks it
        const names = existingBookings.map((b: any) => b.users?.name || 'Unknown').join(', ')
        return NextResponse.json({
          error: `Cannot block this day. There ${existingBookings.length === 1 ? 'is' : 'are'} ${existingBookings.length} confirmed booking${existingBookings.length !== 1 ? 's' : ''} on this date (${names}). Please reschedule or cancel existing bookings first.`
        }, { status: 409 })
      } else {
        // Time range block — check for overlaps
        const blockStart = startTime
        const blockEnd = endTime
        const conflicts = existingBookings.filter((b: any) => {
          const bStart = b.booking_time?.slice(0,5)
          const bEnd = b.end_time?.slice(0,5)
          return bStart < blockEnd && bEnd > blockStart
        })
        if (conflicts.length > 0) {
          const names = conflicts.map((b: any) => b.users?.name || 'Unknown').join(', ')
          return NextResponse.json({
            error: `Cannot block ${startTime}–${endTime}. There ${conflicts.length === 1 ? 'is' : 'are'} ${conflicts.length} confirmed booking${conflicts.length !== 1 ? 's' : ''} in this time range (${names}). Please reschedule or cancel them first.`
          }, { status: 409 })
        }
      }
    }

    // Create the block
    const { data, error } = await supabaseAdmin
      .from('blocked_slots')
      .insert({
        block_date: blockDate,
        start_time: isFullDay ? null : startTime,
        end_time: isFullDay ? null : endTime,
        is_full_day: isFullDay,
        reason: reason || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, block: data })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
