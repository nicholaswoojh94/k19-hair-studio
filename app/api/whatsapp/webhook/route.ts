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

// Only status events for templates our system sends (k19_booking_confirmation,
// k19_appointment_reminder, k19_login) are persisted. Coexistence mode also mirrors
// Kyan's WhatsApp Business app traffic here — inbound chats, echoes, history sync and
// statuses for his manual replies — which is customer personal data we must not store.
const KEPT_CATEGORIES = new Set(['utility', 'authentication'])

type StatusRow = {
  event_type:        'status'
  wamid:             string
  status:            string | null
  template_category: string
  event_at:          string | null
}

// Extract minimal rows for status events with a kept pricing/conversation category
function extractTemplateStatuses(body: Record<string, unknown>): StatusRow[] {
  const rows: StatusRow[] = []
  const entries = Array.isArray(body?.entry) ? (body.entry as any[]) : []
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const statuses = change?.value?.statuses
      if (!Array.isArray(statuses)) continue
      for (const s of statuses) {
        const category = s?.pricing?.category ?? s?.conversation?.origin?.type
        if (typeof s?.id !== 'string' || !KEPT_CATEGORIES.has(category)) continue
        const ts = Number(s.timestamp)
        rows.push({
          event_type:        'status',
          wamid:             s.id,
          status:            typeof s.status === 'string' ? s.status : null,
          template_category: category,
          event_at:          Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : null,
        })
      }
    }
  }
  return rows
}

// Incoming events from Meta via Dualhook's Webhook Override
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const rows = extractTemplateStatuses(body)

    if (rows.length > 0) {
      const { error } = await makeAdmin().from('whatsapp_webhook_events').insert(rows)
      if (error) {
        console.error('[whatsapp/webhook] DB insert failed:', error.message)
      } else {
        // Concise log for Vercel function visibility — no payload content
        console.log(`[whatsapp/webhook] stored ${rows.length} template status event(s)`)
      }
    }
  } catch (err) {
    // Still return 200 — Meta retries aggressively on non-200
    console.error('[whatsapp/webhook] parse/store error:', err instanceof Error ? err.message : err)
  }

  // Always ack immediately, including for dropped events
  return new NextResponse('OK', { status: 200 })
}
