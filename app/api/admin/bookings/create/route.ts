import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const {
      userId, newCustomer, serviceId,
      bookingDate, bookingTime, notes
    } = await req.json()

    let finalUserId = userId

    if (!userId && newCustomer) {
      const { phone, countryCode, name, email } = newCustomer
      const fullPhone = `${countryCode || '+60'}${phone}`

      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', fullPhone)
        .single()

      if (existing) {
        finalUserId = existing.id
      } else {
        const { data: created } = await supabaseAdmin
          .from('users')
          .insert({ phone: fullPhone, country_code: countryCode || '+60', name, email })
          .select()
          .single()
        finalUserId = created?.id
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'Customer required' }, { status: 400 })
    }

    // Get global buffer setting
    const { data: bufferSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'buffer_minutes')
      .single()
    const globalBuffer = parseInt(bufferSetting?.value || '15')

    // Get service duration and per-service buffer override
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('duration_minutes, buffer_minutes')
      .eq('id', serviceId)
      .single()

    // Use service-level buffer if set, otherwise fall back to global
    const bufferMinutes = (service?.buffer_minutes !== null &&
      service?.buffer_minutes !== undefined)
      ? service.buffer_minutes
      : globalBuffer

    const [h, m] = bookingTime.split(':').map(Number)
    const endMins = h * 60 + m + (service?.duration_minutes || 60) + bufferMinutes
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}:00`

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: finalUserId,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: `${bookingTime}:00`,
        end_time: endTime,
        status: 'confirmed',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
