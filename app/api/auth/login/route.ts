import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, countryCode } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const fullPhone = `${countryCode || '+60'}${phone}`

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, email, birthday')
      .eq('phone', fullPhone)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })

  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
