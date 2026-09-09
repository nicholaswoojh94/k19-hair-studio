import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { userId, serviceId, bookingDate, bookingTime } = await req.json()

    if (!userId || !serviceId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get buffer minutes, service duration, and per-customer override in parallel
    const [bufferSetting, service, overrideRes] = await Promise.all([
      supabaseAdmin.from('admin_settings').select('value').eq('key', 'buffer_minutes').single(),
      supabaseAdmin.from('services').select('duration_minutes, buffer_minutes').eq('id', serviceId).single(),
      supabaseAdmin.from('customer_service_durations').select('duration_minutes').eq('customer_id', userId).eq('service_id', serviceId).single(),
    ])

    if (!service.data) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Per-customer override takes precedence over service duration + buffer
    const [hours, minutes] = bookingTime.split(':').map(Number)
    let totalMinutes: number
    if (overrideRes.data?.duration_minutes) {
      totalMinutes = hours * 60 + minutes + overrideRes.data.duration_minutes
    } else {
      const serviceBuffer = service.data.buffer_minutes
      const globalBuffer = parseInt(bufferSetting.data?.value || '15')
      const bufferMinutes = serviceBuffer !== null && serviceBuffer !== undefined
        ? serviceBuffer
        : globalBuffer
      totalMinutes = hours * 60 + minutes + service.data.duration_minutes + bufferMinutes
    }
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    const endTime = `${String(endHours).padStart(2,'0')}:${String(endMins).padStart(2,'0')}:00`
    const startTime = `${bookingTime}:00`

    // Check for conflicting bookings
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_time, end_time')
      .eq('booking_date', bookingDate)
      .eq('status', 'confirmed')

    if (conflicts && conflicts.length > 0) {
      const hasConflict = conflicts.some(existing => {
        const existStart = existing.booking_time
        const existEnd = existing.end_time
        return startTime < existEnd && endTime > existStart
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'This time slot is no longer available. Please choose another time.' },
          { status: 409 }
        )
      }
    }

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: userId,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: startTime,
        end_time: endTime,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) {
      console.error('Booking error:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Queue confirmation notification
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('phone, name')
      .eq('id', userId)
      .single()

    if (user) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          booking_id: booking.id,
          type: 'booking_confirmation',
          channel: 'whatsapp',
          phone: user.phone,
          message: `Hi ${user.name}! Your appointment at K19 Hair Studio has been confirmed for ${bookingDate} at ${bookingTime}. Reply YES to confirm or NO to cancel. See you soon! ✂️`,
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        })
    }

    return NextResponse.json({ success: true, booking })

  } catch (err) {
    console.error('Booking route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
