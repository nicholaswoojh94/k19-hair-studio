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
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Date and serviceId required' },
        { status: 400 }
      )
    }

    // Get service duration
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Get buffer minutes
    const { data: bufferSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'buffer_minutes')
      .single()

    const bufferMinutes = parseInt(bufferSetting?.value || '15')
    const totalDuration = service.duration_minutes + bufferMinutes

    // Get existing confirmed bookings for this date
    const { data: existingBookings } = await supabaseAdmin
      .from('bookings')
      .select('booking_time, end_time')
      .eq('booking_date', date)
      .eq('status', 'confirmed')

    // Get blocked slots for this date
    const { data: blockedSlots } = await supabaseAdmin
      .from('blocked_slots')
      .select('*')
      .eq('block_date', date)

    // All possible slots 11am - 7pm
    const allSlots = [
      '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00'
    ]

    // Filter out unavailable slots
    const availableSlots = allSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number)
      const slotStart = hours * 60 + minutes
      const slotEnd = slotStart + totalDuration

      // Check if slot ends before 8pm (1200 minutes)
      if (slotEnd > 20 * 60) return false

      // Check against blocked slots
      const isBlockedBySlot = (blockedSlots || []).some(b => {
        if (b.is_full_day) return true
        const slotStartStr = `${String(Math.floor(slotStart/60)).padStart(2,'0')}:${String(slotStart%60).padStart(2,'0')}:00`
        const slotEndStr = `${String(Math.floor(slotEnd/60)).padStart(2,'0')}:${String(slotEnd%60).padStart(2,'0')}:00`
        return slotStartStr < b.end_time && slotEndStr > b.start_time
      })

      if (isBlockedBySlot) return false

      // Check conflicts with existing bookings
      if (!existingBookings) return true

      return !existingBookings.some(booking => {
        const [bh, bm] = booking.booking_time.split(':').map(Number)
        const [eh, em] = booking.end_time.split(':').map(Number)
        const bookingStart = bh * 60 + bm
        const bookingEnd = eh * 60 + em
        return slotStart < bookingEnd && slotEnd > bookingStart
      })
    })

    return NextResponse.json({ availableSlots })

  } catch (err) {
    console.error('Availability error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
