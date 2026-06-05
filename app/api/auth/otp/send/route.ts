import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Check test mode from admin_settings
    const { data: testModeSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'whatsapp_otp_test_mode')
      .single()

    const isTestMode = testModeSetting?.value === 'true'

    // Generate OTP
    const otp = isTestMode
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString()

    // Delete any existing unused OTPs for this phone
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('phone', phone)
      .eq('used', false)

    // Store OTP in database
    const { error } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        phone,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

    if (error) {
      console.error('OTP insert error:', error)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    // In test mode, return OTP in response for development
    // In production, send via WhatsApp and never return OTP
    if (isTestMode) {
      return NextResponse.json({
        success: true,
        testMode: true,
        otp // Remove this in production!
      })
    }

    // TODO: Send OTP via WhatsApp Cloud API
    // Will be wired up when WhatsApp API is configured

    return NextResponse.json({ success: true, testMode: false })

  } catch (err) {
    console.error('OTP send error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
