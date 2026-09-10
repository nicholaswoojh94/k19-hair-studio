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
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )

  try {
    const { status, notes, amountCharged } = await req.json()
    const { id } = params

    if (status === 'completed' && (amountCharged === undefined || amountCharged === null || isNaN(parseFloat(amountCharged)) || parseFloat(amountCharged) <= 0)) {
      return NextResponse.json({ error: 'Amount charged is required to complete a booking.' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status }
    if (notes !== undefined) updateData.notes = notes
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.amount_charged = parseFloat(amountCharged)
    }
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = 'admin'
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, services(name_en)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (status === 'completed') {
      const { data: settings } = await supabaseAdmin
        .from('admin_settings')
        .select('value')
        .eq('key', 'loyalty_points_per_rm')
        .single()

      if (settings?.value) {
        const points = Math.round(
          parseFloat(booking.amount_charged) * parseFloat(settings.value)
        )
        if (points > 0) {
          const serviceName = booking.services?.name_en || 'visit'
          await supabaseAdmin
            .from('loyalty_points')
            .insert({
              user_id: booking.user_id,
              booking_id: booking.id,
              points,
              type: 'earned_visit',
              description: `${serviceName} on ${booking.booking_date}`,
            })
        }
      }
    }

    return NextResponse.json({ success: true, booking })

  } catch (err) {
    console.error('Update booking error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
