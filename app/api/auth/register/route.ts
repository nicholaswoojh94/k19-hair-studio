import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { phone, countryCode, name, email, birthday } = await req.json()

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone and name are required' },
        { status: 400 }
      )
    }

    const fullPhone = `${countryCode}${phone}`

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', fullPhone)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone: fullPhone,
        country_code: countryCode,
        name,
        email: email || null,
        birthday: birthday || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Register error:', error)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user })

  } catch (err) {
    console.error('Register route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
