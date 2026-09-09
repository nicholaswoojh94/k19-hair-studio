import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const COMMON_CODES = ['+60','+65','+61','+44','+62','+63','+66','+84','+86','+81','+82','+91','+1']

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { phone, code, name, email, birthday, countryCode } = await req.json()

    if (!phone || !code || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalEmail = email.trim().toLowerCase()

    // Verify OTP using same logic as /api/auth/otp/verify
    const { data: otpRecord } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Mark used before creating account to prevent double-submit races
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)

    // Defensive duplicate check at creation time
    const [dupPhone, dupEmail] = await Promise.all([
      supabaseAdmin.from('users').select('id').eq('phone', phone).single(),
      supabaseAdmin.from('users').select('id').eq('email', normalEmail).single(),
    ])

    if (dupPhone.data) {
      return NextResponse.json(
        { error: 'An account with this phone number was just created. Please log in.' },
        { status: 409 }
      )
    }
    if (dupEmail.data) {
      return NextResponse.json(
        { error: 'An account with this email was just created. Please log in.' },
        { status: 409 }
      )
    }

    const resolvedCountryCode = countryCode || COMMON_CODES.find(c => phone.startsWith(c)) || '+60'

    const { data: user, error: insertErr } = await supabaseAdmin
      .from('users')
      .insert({
        phone,
        country_code: resolvedCountryCode,
        name: name.trim(),
        email: normalEmail,
        birthday: birthday || null,
      })
      .select('id, name, phone, email, birthday')
      .single()

    if (insertErr || !user) {
      console.error('user insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('register/verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
