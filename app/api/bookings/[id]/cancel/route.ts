import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function formatNotificationTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatNotificationDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { userId } = await req.json()
    const { id } = params

    // Fetch booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, users(name), services(name_en)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        error: 'Only confirmed bookings can be cancelled'
      }, { status: 400 })
    }

    // Check 24-hour cutoff
    const bookingDateTime = new Date(
      `${booking.booking_date}T${booking.booking_time}`
    )
    const now = new Date()
    const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntil < 24) {
      return NextResponse.json({
        error: `Cancellations must be made at least 24 hours before your appointment. Your appointment is in ${Math.round(hoursUntil)} hours.`
      }, { status: 400 })
    }

    // Cancel the booking
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'customer',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Cancelled by customer via app',
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const customerName = booking.users?.name || 'A customer'
    const serviceName = booking.services?.name_en || 'their appointment'
    const message = `${customerName} cancelled their ${formatNotificationTime(booking.booking_time)} ${serviceName} appointment on ${formatNotificationDate(booking.booking_date)}`

    await supabaseAdmin.from('admin_notifications').insert({
      type: 'booking_cancelled',
      booking_id: booking.id,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
