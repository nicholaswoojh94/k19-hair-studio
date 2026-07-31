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

function emailHtml(code: string, toEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital@1&family=Poppins:wght@400;600&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#1C1C1C;font-family:'Poppins',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1C1C;">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <p style="margin:0;font-family:'Lora',Georgia,serif;font-size:24px;font-style:italic;font-weight:400;color:#C9A96E;letter-spacing:-0.02em;">K19 Hair Studio</p>
          </td>
        </tr>

        <!-- Top rule -->
        <tr><td style="height:1px;background:rgba(201,169,110,0.2);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 0 36px;">
            <p style="margin:0 0 6px;font-family:'Poppins',Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(250,250,248,0.4);">Email Verification</p>
            <p style="margin:0 0 32px;font-family:'Lora',Georgia,serif;font-size:26px;font-style:italic;font-weight:400;color:#FAFAF8;line-height:1.2;">Your verification code</p>

            <!-- Code box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(201,169,110,0.08);border:1px solid rgba(201,169,110,0.35);border-radius:8px;padding:18px 40px;">
                        <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:38px;font-weight:600;color:#C9A96E;letter-spacing:0.25em;">${code}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:13px;line-height:1.7;color:rgba(250,250,248,0.45);">
              This code expires in <strong style="color:rgba(250,250,248,0.75);">10 minutes</strong>.<br>
              If you did not request this, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Bottom rule -->
        <tr><td style="height:1px;background:rgba(201,169,110,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:22px;">
            <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:11px;color:rgba(250,250,248,0.2);">
              K19 Hair Studio &middot; Damansara Damai, Petaling Jaya
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const db = makeAdmin()
  try {
    const { name, phone, countryCode, email, birthday } = await req.json()

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !birthday) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const fullPhone = `${countryCode || '+60'}${phone.trim()}`
    const normalEmail = email.trim().toLowerCase()

    // Duplicate phone check
    const { data: byPhone } = await db.from('users').select('id').eq('phone', fullPhone).single()
    if (byPhone) {
      return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 })
    }

    // Duplicate email check
    const { data: byEmail } = await db.from('users').select('id').eq('email', normalEmail).single()
    if (byEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    // Clear any existing unused OTPs for this email
    await db.from('email_otp_codes').delete().eq('email', normalEmail).eq('used', false)

    // Generate and store OTP alongside registration data
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const { error: insertErr } = await db.from('email_otp_codes').insert({
      email: normalEmail,
      code,
      name: name.trim(),
      phone: fullPhone,
      birthday: birthday || null,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    if (insertErr) {
      console.error('email_otp insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
    }

    // Send via Resend REST API
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'K19 Hair Studio <noreply@k19hairstudio.com>',
        to: [normalEmail],
        subject: 'Your K19 Hair Studio verification code',
        html: emailHtml(code, normalEmail),
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('Resend API error:', emailRes.status, errBody)
      // Clean up the OTP row so next attempt gets a fresh code
      await db.from('email_otp_codes').delete().eq('email', normalEmail).eq('code', code)
      return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('email-otp/send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
