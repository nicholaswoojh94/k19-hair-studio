import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

export async function POST(req: NextRequest) {
  const db = makeAdmin()
  try {
    const { email, code } = await req.json()

    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const normalEmail = email.trim().toLowerCase()

    // Find valid, unexpired, unused OTP and retrieve stored registration data
    const { data: otpRow } = await db
      .from('email_otp_codes')
      .select('id, code, name, phone, birthday, expires_at, used')
      .eq('email', normalEmail)
      .eq('code', code.trim())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otpRow) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 })
    }

    // Mark OTP used before creating the account to prevent double-submit races
    await db.from('email_otp_codes').update({ used: true }).eq('id', otpRow.id)

    // Defensive: check phone/email not grabbed by another registration during the OTP window
    const { data: dupPhone } = await db.from('users').select('id').eq('phone', otpRow.phone).single()
    if (dupPhone) {
      return NextResponse.json({ error: 'An account with this phone number was just created. Please log in.' }, { status: 409 })
    }
    const { data: dupEmail } = await db.from('users').select('id').eq('email', normalEmail).single()
    if (dupEmail) {
      return NextResponse.json({ error: 'An account with this email was just created. Please log in.' }, { status: 409 })
    }

    // Extract country code from stored full phone (e.g. "+60111234567" → "+60")
    const commonCodes = ['+60','+65','+61','+44','+62','+63','+66','+84','+86','+81','+82','+91','+1']
    const countryCode = commonCodes.find(c => otpRow.phone.startsWith(c)) || '+60'

    // Create the account — only reaches here after successful email verification
    const { data: user, error: insertErr } = await db
      .from('users')
      .insert({
        phone: otpRow.phone,
        country_code: countryCode,
        name: otpRow.name,
        email: normalEmail,
        birthday: otpRow.birthday || null,
        email_verified: true,
      })
      .select('id, name, phone, email, birthday')
      .single()

    if (insertErr || !user) {
      console.error('user insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('email-otp/verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
