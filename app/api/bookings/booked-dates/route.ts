import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function toTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
}

function dateFmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )

  const { searchParams } = new URL(req.url)
  const year      = parseInt(searchParams.get('year')  ?? '')
  const month     = parseInt(searchParams.get('month') ?? '') // 0-indexed (JS month)
  const serviceId = searchParams.get('serviceId')

  if (isNaN(year) || isNaN(month) || !serviceId) {
    return NextResponse.json({ error: 'year, month (0-indexed), serviceId required' }, { status: 400 })
  }

  try {
    const firstDate = new Date(year, month, 1)
    const lastDate  = new Date(year, month + 1, 0)
    const firstStr  = dateFmt(firstDate)
    const lastStr   = dateFmt(lastDate)

    const [serviceRes, bufferRes, hoursRes, bookingsRes, blockedRes] = await Promise.all([
      supabase.from('services').select('duration_minutes').eq('id', serviceId).single(),
      supabase.from('admin_settings').select('value').eq('key', 'buffer_minutes').single(),
      supabase.from('business_hours').select('day_of_week, opening_time, closing_time, is_closed'),
      supabase.from('bookings').select('booking_date, booking_time, end_time').eq('status', 'confirmed').gte('booking_date', firstStr).lte('booking_date', lastStr),
      supabase.from('blocked_slots').select('block_date, start_time, end_time, is_full_day').gte('block_date', firstStr).lte('block_date', lastStr),
    ])

    if (!serviceRes.data) return NextResponse.json({ bookedDates: [] })

    const totalDuration = serviceRes.data.duration_minutes + parseInt(bufferRes.data?.value || '15')

    // Index business hours by day-of-week
    const hoursByDow = new Map<number, { opening: number; closing: number; isClosed: boolean }>()
    for (const h of hoursRes.data || []) {
      hoursByDow.set(h.day_of_week, {
        opening: toMinutes(h.opening_time),
        closing: toMinutes(h.closing_time),
        isClosed: h.is_closed,
      })
    }

    // Index bookings and blocked slots by date string
    const bookingsByDate = new Map<string, Array<{ start: number; end: number }>>()
    for (const b of bookingsRes.data || []) {
      if (!bookingsByDate.has(b.booking_date)) bookingsByDate.set(b.booking_date, [])
      bookingsByDate.get(b.booking_date)!.push({ start: toMinutes(b.booking_time), end: toMinutes(b.end_time) })
    }

    const blockedByDate = new Map<string, typeof blockedRes.data>()
    for (const b of (blockedRes.data || [])) {
      if (!blockedByDate.has(b.block_date)) blockedByDate.set(b.block_date, [])
      blockedByDate.get(b.block_date)!.push(b)
    }

    const today = new Date(); today.setHours(0,0,0,0)
    const bookedDates: string[] = []

    for (let day = 1; day <= lastDate.getDate(); day++) {
      const date = new Date(year, month, day)
      if (date < today) continue // past dates already greyed out by calendar

      const ds  = dateFmt(date)
      const dow = date.getDay()
      const hrs = hoursByDow.get(dow)

      if (!hrs || hrs.isClosed) continue // closed days already greyed out by calendar

      const bookings = bookingsByDate.get(ds) || []
      const blocks   = blockedByDate.get(ds) || []
      const hasFullDayBlock = blocks.some(b => b.is_full_day)

      if (hasFullDayBlock) { bookedDates.push(ds); continue }

      let hasAvailableSlot = false
      for (let slotStart = hrs.opening; slotStart < hrs.closing; slotStart += 60) {
        const slotEnd = slotStart + totalDuration
        if (slotEnd > hrs.closing) continue

        const slotStartStr = toTimeStr(slotStart)
        const slotEndStr   = toTimeStr(slotEnd)

        const blockedByPartial = blocks.some(b => slotStartStr < b.end_time && slotEndStr > b.start_time)
        if (blockedByPartial) continue

        const hasConflict = bookings.some(b => slotStart < b.end && slotEnd > b.start)
        if (!hasConflict) { hasAvailableSlot = true; break }
      }

      if (!hasAvailableSlot) bookedDates.push(ds)
    }

    return NextResponse.json({ bookedDates })
  } catch (err) {
    console.error('booked-dates error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
