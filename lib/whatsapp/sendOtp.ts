import { getSupabaseAdmin } from '@/lib/supabase'

type SendOtpResult =
  | { success: true; devMode: true }
  | { success: true; devMode: false }
  | { success: false; error: string }

export async function sendOtp(phone: string, code: string): Promise<SendOtpResult> {
  const supabase = getSupabaseAdmin()

  const { data: sendingSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'whatsapp_sending_enabled')
    .single()

  const sendingEnabled = sendingSetting?.value === 'true'

  if (!sendingEnabled) {
    console.log(`[WHATSAPP DEV MODE] Would send OTP ${code} to ${phone}`)
    return { success: true, devMode: true }
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.error('[WHATSAPP] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN env vars')
    return { success: false, error: 'WhatsApp not configured — missing env vars' }
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'k19_otp_verification',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
        // Include if your template has a "Copy Code" button (index 0).
        // Remove this block if your template has no button component.
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }],
        },
      ],
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`
      const errCode = data?.error?.code ?? 'unknown'
      console.error(`[WHATSAPP] Send failed — code ${errCode}: ${errMsg}`, JSON.stringify(data))
      return { success: false, error: errMsg }
    }

    console.log(`[WHATSAPP] OTP sent to ${phone}, message id: ${data?.messages?.[0]?.id}`)
    return { success: true, devMode: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[WHATSAPP] Network error sending OTP:', msg)
    return { success: false, error: msg }
  }
}
