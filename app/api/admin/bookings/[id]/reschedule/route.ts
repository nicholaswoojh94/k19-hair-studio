import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { bookingDate, bookingTime, serviceId } = await req.json()
    const { id } = params

    // Get service duration and buffer
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes, buffer_minutes')
      .eq('id', serviceId)
      .single()

    const { data: bufferSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'buffer_minutes')
      .single()

    const globalBuffer = parseInt(bufferSetting?.value || '15')
    const bufferMinutes = service?.buffer_minutes ?? globalBuffer

    const [h, m] = bookingTime.split(':').map(Number)
    const endMins = h * 60 + m + (service?.duration_minutes || 60) + bufferMinutes
    const endTime = `${String(Math.floor(endMins/60)).padStart(2,'0')}:${String(endMins%60).padStart(2,'0')}:00`
    const startTime = `${bookingTime}:00`

    // Check conflicts (excluding current booking)
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_time, end_time')
      .eq('booking_date', bookingDate)
      .eq('status', 'confirmed')
      .neq('id', id)

    if (conflicts && conflicts.length > 0) {
      const hasConflict = conflicts.some((b: any) => {
        return startTime < b.end_time && endTime > b.booking_time
      })
      if (hasConflict) {
        return NextResponse.json({
          error: 'This time slot conflicts with another booking. Please choose a different time.'
        }, { status: 409 })
      }
    }

    // Check blocked slots
    const { data: blocks } = await supabaseAdmin
      .from('blocked_slots')
      .select('*')
      .eq('block_date', bookingDate)

    if (blocks && blocks.length > 0) {
      const isBlocked = blocks.some((b: any) => {
        if (b.is_full_day) return true
        return startTime < b.end_time && endTime > b.start_time
      })
      if (isBlocked) {
        return NextResponse.json({
          error: 'This time slot is blocked. Please choose a different time.'
        }, { status: 409 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        booking_date: bookingDate,
        booking_time: startTime,
        end_time: endTime,
        service_id: serviceId,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, booking: data })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
