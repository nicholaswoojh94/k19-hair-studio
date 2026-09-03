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

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// RFC 5545 §3.1: lines must not exceed 75 octets; fold with CRLF + single space
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const bytes = encoder.encode(line)
  if (bytes.length <= 75) return line

  const segments: string[] = []
  let start = 0
  let first = true

  while (start < bytes.length) {
    // First segment: 75 content octets; continuation: 74 (space takes 1)
    let end = start + (first ? 75 : 74)
    if (end >= bytes.length) {
      segments.push(decoder.decode(bytes.slice(start)))
      break
    }
    // Back up to a valid UTF-8 character boundary (not in the middle of a multi-byte char)
    while (end > start && (bytes[end] & 0xc0) === 0x80) end--
    segments.push(decoder.decode(bytes.slice(start, end)))
    start = end
    first = false
  }

  return segments.join('\r\n ')
}

function toUtcString(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM:SS — Malaysia is UTC+8, subtract 8h
  const [y, mo, d] = date.split('-').map(Number)
  const [h, m, s] = time.split(':').map(Number)
  const utc = new Date(Date.UTC(y, mo - 1, d, h - 8, m, s ?? 0))
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
  return (
    pad(utc.getUTCFullYear(), 4) +
    pad(utc.getUTCMonth() + 1) +
    pad(utc.getUTCDate()) + 'T' +
    pad(utc.getUTCHours()) +
    pad(utc.getUTCMinutes()) +
    pad(utc.getUTCSeconds()) + 'Z'
  )
}

function nowUtcString(): string {
  const d = new Date()
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0')
  return (
    pad(d.getUTCFullYear(), 4) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + 'Z'
  )
}

type BookingRow = {
  id: string
  booking_date: string
  booking_time: string
  end_time: string | null
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  users: { name: string | null; phone: string | null } | null
  services: { name_en: string | null; duration_minutes: number } | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  // Strip trailing .ics suffix that some calendar apps append
  const tokenParam = params.token.replace(/\.ics$/, '')

  const db = makeAdmin()

  // Validate token — return 404 on any mismatch (don't leak endpoint existence)
  const { data: tokenRow } = await db
    .from('admin_settings')
    .select('value')
    .eq('key', 'calendar_feed_token')
    .single()

  if (!tokenRow?.value || tokenRow.value !== tokenParam) {
    return new NextResponse(null, { status: 404 })
  }

  // Scope to 3 months ago onward to keep the feed reasonable
  const floor = new Date()
  floor.setMonth(floor.getMonth() - 3)
  const floorDate = floor.toISOString().slice(0, 10)

  const { data: bookings } = await db
    .from('bookings')
    .select('id, booking_date, booking_time, end_time, status, users(name, phone), services(name_en, duration_minutes)')
    .gte('booking_date', floorDate)
    .order('booking_date', { ascending: true })

  const dtstamp = nowUtcString()
  const crlf = '\r\n'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//K19 Hair Studio//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:K19 Hair Studio Bookings',
  ]

  for (const b of (bookings as BookingRow[] | null) ?? []) {
    const customerName = b.users?.name || 'Unknown Customer'
    const serviceName = b.services?.name_en || 'Service'
    const phone = b.users?.phone || ''
    const duration = b.services?.duration_minutes ?? 60

    // Derive end time from start + duration if end_time not stored
    let endTime = b.end_time
    if (!endTime) {
      const [h, m] = b.booking_time.split(':').map(Number)
      const total = h * 60 + m + duration
      endTime = `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}:00`
    }

    const dtstart = toUtcString(b.booking_date, b.booking_time)
    const dtend = toUtcString(b.booking_date, endTime)
    const icsStatus = b.status === 'cancelled' || b.status === 'no_show' ? 'CANCELLED' : 'CONFIRMED'

    const description = escapeIcs(`Service: ${serviceName}\nPhone: ${phone}\nStatus: ${b.status}`)

    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:booking-${b.id}@k19hairstudio.com`))
    lines.push(foldLine(`DTSTAMP:${dtstamp}`))
    lines.push(foldLine(`DTSTART:${dtstart}`))
    lines.push(foldLine(`DTEND:${dtend}`))
    lines.push(foldLine(`SUMMARY:${escapeIcs(`${customerName} — ${serviceName}`)}`))
    lines.push(foldLine(`DESCRIPTION:${description}`))
    lines.push(foldLine(`LOCATION:${escapeIcs('The Zizz, Damansara Damai, Petaling Jaya')}`))
    lines.push(foldLine(`STATUS:${icsStatus}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const icsContent = lines.join(crlf) + crlf

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
    },
  })
}
