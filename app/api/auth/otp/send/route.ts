import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOtp } from '@/lib/whatsapp/sendOtp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
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

    // CASE 1 — test mode: dummy code, no real message, return OTP in response
    if (isTestMode) {
      const otp = '123456'

      await supabaseAdmin.from('otp_codes').delete().eq('phone', phone).eq('used', false)

      const { error } = await supabaseAdmin.from('otp_codes').insert({
        phone,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

      if (error) {
        console.error('OTP insert error:', error)
        return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
      }

      return NextResponse.json({ success: true, testMode: true, otp })
    }

    // CASE 2 & 3 — real OTP; sendOtp decides whether to actually call Meta
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await supabaseAdmin.from('otp_codes').delete().eq('phone', phone).eq('used', false)

    const { error } = await supabaseAdmin.from('otp_codes').insert({
      phone,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (error) {
      console.error('OTP insert error:', error)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    const result = await sendOtp(phone, otp)

    if (!result.success) {
      console.error('[OTP route] sendOtp failed:', result.error)
      // OTP is stored — user can retry; don't block the flow with a 500
      return NextResponse.json({ success: true, testMode: false, sendError: result.error })
    }

    return NextResponse.json({ success: true, testMode: false })

  } catch (err) {
    console.error('OTP send error details:', JSON.stringify(err, null, 2))
    console.error('OTP send error message:', err instanceof Error ? err.message : String(err))
    console.error('ENV CHECK - URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error('ENV CHECK - KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
