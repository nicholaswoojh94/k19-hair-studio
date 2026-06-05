import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { status, notes } = await req.json()
    const { id } = params

    const updateData: Record<string, unknown> = { status }
    if (notes !== undefined) updateData.notes = notes
    if (status === 'completed') updateData.completed_at = new Date().toISOString()
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancelled_by = 'admin'
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
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

      const { data: service } = await supabaseAdmin
        .from('services')
        .select('price_from')
        .eq('id', booking.service_id)
        .single()

      if (service?.price_from && settings?.value) {
        const points = Math.floor(
          parseFloat(service.price_from) * parseFloat(settings.value)
        )
        if (points > 0) {
          await supabaseAdmin
            .from('loyalty_points')
            .insert({
              user_id: booking.user_id,
              booking_id: booking.id,
              points,
              type: 'earned_visit',
              description: `Visit on ${booking.booking_date}`,
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
