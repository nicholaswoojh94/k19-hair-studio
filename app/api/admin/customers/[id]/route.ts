import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { id } = params

    const [userRes, bookingsRes, loyaltyRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', id).single(),
      supabaseAdmin
        .from('bookings')
        .select('id, booking_date, booking_time, status, services(name_en, price_from)')
        .eq('user_id', id)
        .order('booking_date', { ascending: false }),
      supabaseAdmin
        .from('loyalty_points')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    const balance = (loyaltyRes.data || []).reduce((sum: number, p: { is_expired: boolean; points: number }) =>
      p.is_expired ? sum : sum + p.points, 0)

    return NextResponse.json({
      customer: userRes.data,
      bookings: bookingsRes.data || [],
      loyaltyPoints: loyaltyRes.data || [],
      loyaltyBalance: balance,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { id } = params
    const { name, email, birthday, is_active } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ name, email, birthday: birthday || null, is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, customer: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
