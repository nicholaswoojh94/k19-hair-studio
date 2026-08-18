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

// Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// Classify the event type from Meta's nested payload structure
function classifyEvent(body: Record<string, unknown>): string {
  try {
    const changes = (body?.entry as any[])?.[0]?.changes
    if (!Array.isArray(changes) || changes.length === 0) return 'unknown'
    const value = changes[0]?.value
    if (!value) return 'unknown'
    if (value.messages)        return 'message'
    if (value.statuses)        return 'status'
    if (value.errors)          return 'error'
    if (value.template_status) return 'template_status'
    if (value.account_update)  return 'account_update'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

// Extract the customer phone number from the payload if present
function extractPhone(body: Record<string, unknown>): string | null {
  try {
    const value = (body?.entry as any[])?.[0]?.changes?.[0]?.value
    if (!value) return null
    // Inbound message — contact's wa_id
    if (value.messages && value.contacts?.[0]?.wa_id) {
      return value.contacts[0].wa_id as string
    }
    // Delivery/read status — recipient_id on the status object
    if (value.statuses?.[0]?.recipient_id) {
      return value.statuses[0].recipient_id as string
    }
    return null
  } catch {
    return null
  }
}

// Incoming events from Meta via Dualhook's Webhook Override
export async function POST(req: NextRequest) {
  const db = makeAdmin()
  try {
    const body = await req.json() as Record<string, unknown>

    const eventType   = classifyEvent(body)
    const phoneNumber = extractPhone(body)

    const { error } = await db.from('whatsapp_webhook_events').insert({
      event_type:   eventType,
      phone_number: phoneNumber,
      payload:      body,
      processed:    false,
    })

    if (error) {
      console.error('[whatsapp/webhook] DB insert failed:', error.message)
    } else {
      // Concise log for Vercel function visibility — no payload content
      console.log(`[whatsapp/webhook] stored event_type=${eventType} phone=${phoneNumber ?? 'n/a'}`)
    }
  } catch (err) {
    // Still return 200 — Meta retries aggressively on non-200
    console.error('[whatsapp/webhook] parse/store error:', err instanceof Error ? err.message : err)
  }

  // Always ack immediately
  return new NextResponse('OK', { status: 200 })
}
