'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4  // 4 = success screen (not shown as numbered step)

interface BookingState {
  service: string
  date: Date | null
  time: string
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['S','M','T','W','T','F','S']

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${String(m).padStart(2,'0')} ${period}`
}

// ─── Calendar ────────────────────────────────────────────────────────────────
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Calendar({
  selected,
  onSelect,
  closedDays,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
  closedDays: Set<number>
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [yr, setYr] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())

  const firstDay = new Date(yr, mo, 1).getDay()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()

  function prevMonth() { if (mo === 0) { setMo(11); setYr(y => y - 1) } else setMo(m => m - 1) }
  function nextMonth() { if (mo === 11) { setMo(0); setYr(y => y + 1) } else setMo(m => m + 1) }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)]

  const closedDayNames = Array.from(closedDays).sort().map(d => DOW_NAMES[d])

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 6, padding: '1rem' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.4)', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}
          onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.4)')}>‹</button>
        <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {MONTH_NAMES[mo]} {yr}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.4)', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}
          onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.4)')}>›</button>
      </div>

      {/* Day headers — closed days are dimmed and italicised */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_HEADERS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.62rem', padding: '4px 0', fontFamily: "'Poppins',sans-serif",
            color: closedDays.has(i) ? 'rgba(201,169,110,0.35)' : 'rgba(250,250,248,0.25)',
            fontStyle: closedDays.has(i) ? 'italic' : 'normal' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i}/>
          const date = new Date(yr, mo, day)
          const isClosedDay = closedDays.has(date.getDay())
          const isPast = date < today
          const isDisabled = isClosedDay || isPast
          const isSelected = selected?.getTime() === date.getTime()
          const isToday = date.getTime() === today.getTime()

          return (
            <div key={i}
              onClick={() => !isDisabled && onSelect(date)}
              style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', margin: '0 auto',
                fontSize: '0.78rem', fontFamily: "'Poppins',sans-serif",
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                color: isDisabled ? 'rgba(250,250,248,0.15)' : isSelected ? '#1C1C1C' : 'rgba(250,250,248,0.75)',
                background: isSelected ? '#C9A96E' : 'transparent',
                border: isToday && !isSelected ? '1px solid rgba(201,169,110,0.4)' : '1px solid transparent',
                fontWeight: isSelected ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseOver={e => { if (!isDisabled && !isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)' }}
              onMouseOut={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {day}
            </div>
          )
        })}
      </div>
      {closedDayNames.length > 0 && (
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', color: 'rgba(201,169,110,0.4)', textAlign: 'center', marginTop: '0.6rem', fontStyle: 'italic' }}>
          Closed: {closedDayNames.join(', ')}
        </p>
      )}
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
      {[1,2,3].map((n, i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontFamily: "'Poppins',sans-serif", fontWeight: 600,
            border: '1.5px solid',
            borderColor: n < current ? '#C9A96E' : n === current ? '#C9A96E' : 'rgba(201,169,110,0.2)',
            background: n < current ? '#C9A96E' : n === current ? 'rgba(201,169,110,0.08)' : 'transparent',
            color: n < current ? '#1C1C1C' : n === current ? '#C9A96E' : 'rgba(250,250,248,0.25)',
            transition: 'all 0.3s ease',
          }}>
            {n < current
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : n}
          </div>
          {i < 2 && (
            <div style={{ width: 32, height: 1, margin: '0 4px', background: n < current ? 'rgba(201,169,110,0.5)' : 'rgba(201,169,110,0.12)', transition: 'background 0.3s ease' }}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [authState, setAuthState] = useState<'loading' | 'gated' | 'allowed'>('loading')
  const [step, setStep] = useState<Step>(1)
  const [anim, setAnim] = useState(true)
  const [booking, setBooking] = useState<BookingState>({ service: '', date: null, time: '' })
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Haircut'])
  const [closedDays, setClosedDays] = useState<Set<number>>(new Set())

  function toggleCategory(cat: string) {
    setExpandedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  // Auth check on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('k19_user')
      if (!raw) { setAuthState('gated'); return }
      JSON.parse(raw)
      setAuthState('allowed')
    } catch {
      setAuthState('gated')
    }
  }, [])

  useEffect(() => {
    async function fetchServices() {
      const res = await fetch('/api/services')
      const data = await res.json()
      if (data.services) setServices(data.services)
    }
    async function fetchBusinessHours() {
      try {
        const res = await fetch('/api/business-hours')
        const data = await res.json()
        if (data.hours) {
          const closed = new Set<number>(
            data.hours
              .filter((h: { day_of_week: number; is_closed: boolean }) => h.is_closed)
              .map((h: { day_of_week: number }) => h.day_of_week)
          )
          setClosedDays(closed)
        }
      } catch {
        // fail silently — no days blocked
      }
    }
    fetchServices()
    fetchBusinessHours()
  }, [])

  async function fetchAvailability(date: Date, serviceId: string) {
    if (!serviceId) return
    setSlotsLoading(true)
    setAvailableSlots([])
    try {
      const d = date
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const res = await fetch(`/api/bookings/availability?date=${dateStr}&serviceId=${serviceId}`)
      const data = await res.json()
      setAvailableSlots(data.availableSlots || [])
    } catch {
      setAvailableSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  // Animate step transitions
  function goStep(next: Step) {
    setAnim(false)
    setTimeout(() => { setStep(next); setAnim(true) }, 220)
  }

  async function handleConfirm() {
    setSubmitting(true)
    setBookingError('')

    try {
      const raw = localStorage.getItem('k19_user')
      if (!raw) {
        window.location.href = '/login?redirect=/booking'
        return
      }
      const user = JSON.parse(raw)

      const d = booking.date!
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          serviceId: booking.service,
          bookingDate: dateStr,
          bookingTime: booking.time,
          serviceBufferMinutes: selectedService?.buffer_minutes || null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setBookingError(data.error || 'Failed to create booking. Please try again.')
        return
      }

      goStep(4)

    } catch {
      setBookingError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedDate = booking.date
    ? booking.date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const groupedServices = services.reduce((acc: any, service: any) => {
    const cat = service.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(service)
    return acc
  }, {})

  const categoryOrder = ['Haircut', 'Wash', 'Chemical', 'Treatment', 'General']

  // ── Loading state (brief flash while localStorage is read) ──
  if (authState === 'loading') {
    return <div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>
  }

  // ── Change 2: Auth gate interstitial ──
  if (authState === 'gated') {
    return (
      <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '200px 20px 40px', overflowX: 'hidden', maxWidth: '100vw' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          {/* Logo */}
          <Link href="/">
            <Image src="/brand_assets/K19_logo_white_transparent.png" alt="K19 Hair Studio"
              width={300} height={120} style={{ height: 120, width: 'auto', margin: '0 auto 1.5rem' }}/>
          </Link>
          {/* Gold rule */}
          <div style={{ width: 48, height: 1, background: '#C9A96E', margin: '0 auto 2rem', opacity: 0.7 }}/>
          {/* Heading */}
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 'clamp(2rem,6vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Members Only
          </h1>
          {/* Subtext */}
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.9rem', color: 'rgba(250,250,248,0.45)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 2rem' }}>
            Create a free account to book appointments, earn loyalty points, and unlock exclusive birthday treats.
          </p>
          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <Link href="/register?redirect=/booking" className="btn-gold" style={{ minWidth: 160 }}>Create Account</Link>
            <Link href="/login?redirect=/booking" className="btn-outline" style={{ minWidth: 160, height: 48 }}>I have an account</Link>
          </div>
          {/* Fine print */}
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.25)', letterSpacing: '0.02em' }}>
            It&apos;s free. No credit card needed.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', paddingTop: '200px', paddingBottom: '60px', overflowX: 'hidden', maxWidth: '100vw' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* Page heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: '0.4rem' }}>
            K19 Hair Studio
          </p>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 'clamp(1.6rem,5vw,2rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', margin: 0 }}>
            Book an Appointment
          </h1>
        </div>

        <StepIndicator current={step}/>

        {/* Card */}
        <div style={{
          background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
          padding: '2rem',
          opacity: anim ? 1 : 0, transform: anim ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>

          {/* ══ STEP 1 — Service ══════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '1.3rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.4rem', marginTop: 0 }}>
                What are you booking?
              </h2>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)', marginBottom: '1.5rem' }}>
                Choose the service you&apos;d like.
              </p>

              <div style={{ marginBottom: '1.75rem' }}>
                {categoryOrder.filter(cat => groupedServices[cat]?.length > 0).map(category => {
                  const isExpanded = expandedCategories.includes(category)
                  const services = groupedServices[category]
                  return (
                    <div key={category} style={{ marginBottom: '16px' }}>

                      {/* Collapsible category header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px 0',
                          marginBottom: isExpanded ? 12 : 0,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <p style={{
                            fontFamily: "'Poppins',sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(201,169,110,0.7)',
                            margin: 0,
                          }}>
                            {category}
                          </p>
                          <span style={{
                            fontFamily: "'Poppins',sans-serif",
                            fontSize: '0.65rem',
                            color: 'rgba(250,250,248,0.25)',
                          }}>
                            {services.length} service{services.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <svg
                          width="14" height="14" viewBox="0 0 14 14" fill="none"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'rgba(201,169,110,0.5)',
                          }}
                        >
                          <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>

                      {/* Divider line */}
                      <div style={{
                        height: 1,
                        background: 'rgba(201,169,110,0.15)',
                        marginBottom: isExpanded ? 12 : 0,
                      }} />

                      {/* Service cards — only show when expanded */}
                      {isExpanded && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: services.length % 2 !== 0 ? '1fr' : '1fr 1fr',
                          gap: 10,
                        }}>
                          {services.map((service: any, idx: number) => {
                            // For odd-count categories, last item goes full width
                            const isLast = idx === services.length - 1
                            const isOdd = services.length % 2 !== 0
                            const shouldBeFullWidth = isOdd && isLast && services.length > 1

                            return (
                              <div
                                key={service.id}
                                onClick={() => { setSelectedService(service); setBooking(b => ({ ...b, service: service.id })) }}
                                style={{
                                  gridColumn: shouldBeFullWidth ? 'span 2' : 'span 1',
                                  padding: '14px 16px',
                                  borderRadius: 6,
                                  border: selectedService?.id === service.id
                                    ? '1.5px solid #C9A96E'
                                    : '1px solid rgba(201,169,110,0.15)',
                                  background: selectedService?.id === service.id
                                    ? 'rgba(201,169,110,0.1)'
                                    : 'rgba(255,255,255,0.03)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  position: 'relative',
                                  minHeight: 72,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                }}
                              >
                                {/* Gold checkmark when selected */}
                                {selectedService?.id === service.id && (
                                  <div style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#C9A96E',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5L4 7L8 3" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                                <p style={{
                                  fontFamily: "'Poppins',sans-serif",
                                  fontSize: '0.82rem',
                                  fontWeight: selectedService?.id === service.id ? 600 : 400,
                                  color: selectedService?.id === service.id
                                    ? '#C9A96E'
                                    : 'rgba(250,250,248,0.8)',
                                  margin: '0 0 4px',
                                  paddingRight: selectedService?.id === service.id ? 24 : 0,
                                }}>
                                  {service.name_en}
                                </p>
                                <p style={{
                                  fontFamily: "'Poppins',sans-serif",
                                  fontSize: '0.7rem',
                                  color: 'rgba(250,250,248,0.35)',
                                  margin: 0,
                                }}>
                                  ⏱ {service.duration_minutes} min
                                </p>
                                {service.category === 'Haircut' && (
                                  <p style={{
                                    fontFamily: "'Poppins',sans-serif",
                                    fontSize: '0.65rem',
                                    color: 'rgba(201,169,110,0.6)',
                                    margin: '5px 0 0',
                                    letterSpacing: '0.01em',
                                  }}>
                                    ✦ Includes complimentary hairwash
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {!selectedService && (
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.75rem',
                    color: 'rgba(250,250,248,0.25)',
                    textAlign: 'center',
                    margin: '16px 0 0',
                    fontStyle: 'italic',
                  }}>
                    Select a service above to continue
                  </p>
                )}
              </div>

              <button className="btn-gold" style={{ width: '100%', opacity: booking.service ? 1 : 0.4, cursor: booking.service ? 'pointer' : 'not-allowed' }}
                disabled={!booking.service} onClick={() => goStep(2)}>
                Next →
              </button>
            </>
          )}

          {/* ══ STEP 2 — Date & Time ══════════════════════════════════════ */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '1.3rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.4rem', marginTop: 0 }}>
                Pick your date &amp; time
              </h2>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)', marginBottom: '1.25rem' }}>
                Select an available date, then a time slot.
              </p>

              <Calendar selected={booking.date} closedDays={closedDays} onSelect={d => {
                setBooking(b => ({ ...b, date: d, time: '' }))
                fetchAvailability(d, booking.service)
              }}/>

              {/* Time slots */}
              {booking.date && (
                <div style={{ marginTop: '1.25rem' }}>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.35)', marginBottom: '0.6rem' }}>
                    Available times
                  </p>
                  {slotsLoading ? (
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)', textAlign: 'center', padding: '1rem 0' }}>
                      Checking availability...
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)', textAlign: 'center', padding: '1rem 0' }}>
                      No available slots for this date.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {availableSlots.map(slot => {
                        const sel = booking.time === slot
                        return (
                          <button key={slot}
                            onClick={() => setBooking(b => ({ ...b, time: slot }))}
                            style={{
                              padding: '0.5rem 0.25rem', borderRadius: 4, cursor: 'pointer',
                              border: `1px solid ${sel ? '#C9A96E' : 'rgba(201,169,110,0.18)'}`,
                              background: sel ? 'rgba(201,169,110,0.1)' : 'transparent',
                              fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem', fontWeight: sel ? 500 : 400,
                              color: sel ? '#C9A96E' : 'rgba(250,250,248,0.6)',
                              transition: 'all 0.15s ease', textAlign: 'center',
                            }}
                            onMouseOver={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.45)'; (e.currentTarget as HTMLElement).style.color = 'rgba(201,169,110,0.8)' } }}
                            onMouseOut={e => { if (!sel) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.18)'; (e.currentTarget as HTMLElement).style.color = 'rgba(250,250,248,0.6)' } }}
                          >
                            {formatTime(slot)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: '1.75rem' }}>
                <button className="btn-outline" style={{ flex: 1, height: 44 }} onClick={() => goStep(1)}>← Back</button>
                <button className="btn-gold" style={{ flex: 2, opacity: booking.date && booking.time ? 1 : 0.4, cursor: booking.date && booking.time ? 'pointer' : 'not-allowed' }}
                  disabled={!booking.date || !booking.time} onClick={() => goStep(3)}>
                  Next →
                </button>
              </div>
            </>
          )}

          {/* ══ STEP 3 — Confirm Summary ══════════════════════════════════ */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '1.3rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.4rem', marginTop: 0 }}>
                Confirm your booking
              </h2>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)', marginBottom: '1.5rem' }}>
                Review the details below, then confirm.
              </p>

              <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 6, padding: '1.25rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Service', value: selectedService?.name_en ?? '—' },
                  { label: 'Date',    value: formattedDate },
                  { label: 'Time',    value: booking.time ? formatTime(booking.time) : '—' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0' }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.4)', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: '#FAFAF8', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(201,169,110,0.08)' }}/>}
                  </div>
                ))}
              </div>

              {bookingError && (
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', textAlign: 'center' }}>
                  {bookingError}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" style={{ flex: 1, height: 44 }} onClick={() => goStep(2)}>← Back</button>
                <button className="btn-gold" style={{ flex: 2, opacity: submitting ? 0.6 : 1 }} onClick={handleConfirm} disabled={submitting}>
                  {submitting ? 'Please wait...' : 'Confirm Booking'}
                </button>
              </div>
            </>
          )}

          {/* ══ STEP 4 — Confirmation ═════════════════════════════════════ */}
          {step === 4 && (
            <>
              {/* Checkmark */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1.5px solid #C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,169,110,0.06)' }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M5 13l6 6 10-11" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <h2 style={{ fontFamily: "'Lora',serif", fontSize: '1.3rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', textAlign: 'center', marginBottom: '0.4rem', marginTop: 0 }}>
                All done, Booking Successful!
              </h2>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)', textAlign: 'center', marginBottom: '1.5rem' }}>
                Here&apos;s your booking summary.
              </p>

              {/* Summary card */}
              <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 6, padding: '1.25rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Service', value: selectedService?.name_en ?? '—' },
                  { label: 'Date',    value: formattedDate },
                  { label: 'Time',    value: booking.time ? formatTime(booking.time) : '—' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0' }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.4)', letterSpacing: '0.04em' }}>{label}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: '#FAFAF8', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(201,169,110,0.08)' }}/>}
                  </div>
                ))}
              </div>

              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)', textAlign: 'center', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                We&apos;ll send you a reminder via WhatsApp before your appointment.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/appointments" className="btn-gold" style={{ textAlign: 'center' }}>View Appointments</Link>
                <Link href="/" className="btn-outline" style={{ textAlign: 'center', height: 44 }}>← Back to Home</Link>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
