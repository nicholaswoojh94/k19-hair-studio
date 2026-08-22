import { getSupabaseAdmin } from '@/lib/supabase'

type SendOtpResult =
  | { success: true; devMode: true }
  | { success: true; devMode: false }
  | { success: false; error: string }

const DUALHOOK_URL = 'https://api.dualhook.com/v25.0/261935040346286/messages'

export async function sendOtp(phone: string, code: string): Promise<SendOtpResult> {
  const supabase = getSupabaseAdmin()

  const { data: sendingSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'whatsapp_sending_enabled')
    .single()

  const sendingEnabled = sendingSetting?.value === 'true'

  if (!sendingEnabled) {
    console.log(`[WHATSAPP DEV MODE] Would send OTP to ${phone}`)
    return { success: true, devMode: true }
  }

  const dualhookKey = process.env.DUALHOOK_API_KEY
  if (!dualhookKey) {
    console.error('[WHATSAPP] Missing DUALHOOK_API_KEY env var')
    return { success: false, error: 'WhatsApp not configured — missing env vars' }
  }

  // Dualhook requires the phone number without a leading '+'
  const toPhone = phone.startsWith('+') ? phone.slice(1) : phone

  const body = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: 'k19_login',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
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
    const res = await fetch(DUALHOOK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dualhookKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`
      const errCode = data?.error?.code ?? 'unknown'
      console.error(`[WHATSAPP] Dualhook send failed — code ${errCode}: ${errMsg} — phone ${toPhone}`)
      return { success: false, error: errMsg }
    }

    console.log(`[WHATSAPP] OTP sent via Dualhook to ${toPhone}, message id: ${data?.messages?.[0]?.id ?? 'n/a'}`)
    return { success: true, devMode: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[WHATSAPP] Network error sending OTP to ${toPhone}:`, msg)
    return { success: false, error: msg }
  }
}
