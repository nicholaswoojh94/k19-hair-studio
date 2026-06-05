'use client'
import { useState, useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/spinner'

type Booking = {
  id: string
  booking_date: string
  booking_time: string
  end_time: string
  status: string
  notes: string | null
  users: { id: string; name: string; phone: string; email: string } | null
  services: { id: string; name_en: string; duration_minutes: number; price_from: number | null } | null
}

type Service = {
  id: string
  name_en: string
  duration_minutes: number
  price_from: number | null
}

type Customer = {
  id: string
  name: string
  phone: string
  email: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmed: { label: 'Confirmed', color: '#B8860B', bg: '#FFFBF0', border: '#F0D080' },
  completed: { label: 'Completed', color: '#2E7D32', bg: '#F1F8F1', border: '#A5D6A7' },
  cancelled: { label: 'Cancelled', color: '#C62828', bg: '#FFF5F5', border: '#FFCDD2' },
  no_show: { label: 'No Show', color: '#E65100', bg: '#FFF8F0', border: '#FFCC80' },
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

function getWeekDays(date: Date) {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const totalMins = 11 * 60 + i * 30
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

export default function AdminDashboard() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [calView, setCalView] = useState<'day' | 'week' | 'month'>('day')
  const [currentDate, setCurrentDate] = useState(today)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addSlotDate, setAddSlotDate] = useState(todayStr)
  const [addSlotTime, setAddSlotTime] = useState('')

  const [services, setServices] = useState<Service[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', countryCode: '+60', email: '' })
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [addingBooking, setAddingBooking] = useState(false)
  const [addError, setAddError] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetchAllBookings()
    fetchServices()
  }, [])

  useEffect(() => {
    filterBookingsForView()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBookings, calView, currentDate])

  async function fetchAllBookings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bookings?filter=all')
      const data = await res.json()
      setAllBookings(data.bookings || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchServices() {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServices(data.services || [])
  }

  function filterBookingsForView() {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (calView === 'day') {
      setBookings(allBookings.filter(b => b.booking_date === dateStr))
    } else if (calView === 'week') {
      const week = getWeekDays(currentDate)
      const weekStrs = week.map(d => d.toISOString().split('T')[0])
      setBookings(allBookings.filter(b => weekStrs.includes(b.booking_date)))
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      setBookings(allBookings.filter(b => {
        const d = new Date(b.booking_date + 'T00:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      }))
    }
  }

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (calView === 'day') d.setDate(d.getDate() + dir)
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  function getHeaderLabel() {
    if (calView === 'day') {
      return currentDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    } else if (calView === 'week') {
      const week = getWeekDays(currentDate)
      const first = week[0].toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
      const last = week[6].toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${first} – ${last}`
    } else {
      return currentDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        await fetchAllBookings()
        setSelectedBooking(null)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  function handleSearchCustomer(q: string) {
    setCustomerSearch(q)
    setSelectedCustomer(null)
    clearTimeout(searchTimeout.current)
    if (q.length < 2) { setCustomerResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCustomerResults(data.customers || [])
    }, 300)
  }

  async function handleAddBooking() {
    if (!selectedServiceId || !addSlotDate || !addSlotTime) {
      setAddError('Please fill in all required fields.')
      return
    }
    if (!selectedCustomer && !isNewCustomer) {
      setAddError('Please select or add a customer.')
      return
    }
    if (isNewCustomer && !newCustomer.name) {
      setAddError('Please enter the customer name.')
      return
    }

    setAddingBooking(true)
    setAddError('')

    try {
      const res = await fetch('/api/admin/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer?.id || null,
          newCustomer: isNewCustomer ? newCustomer : null,
          serviceId: selectedServiceId,
          bookingDate: addSlotDate,
          bookingTime: addSlotTime,
          notes: bookingNotes,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setAddError(data.error || 'Failed to create booking.')
        return
      }

      await fetchAllBookings()
      setShowAddModal(false)
      resetAddForm()

    } catch {
      setAddError('Something went wrong.')
    } finally {
      setAddingBooking(false)
    }
  }

  function resetAddForm() {
    setCustomerSearch('')
    setCustomerResults([])
    setSelectedCustomer(null)
    setIsNewCustomer(false)
    setNewCustomer({ name: '', phone: '', countryCode: '+60', email: '' })
    setSelectedServiceId('')
    setBookingNotes('')
    setAddError('')
    setAddSlotTime('')
  }

  function openAddModal(date: string, time: string) {
    setAddSlotDate(date)
    setAddSlotTime(time)
    setShowAddModal(true)
  }

  const todayBookings = allBookings.filter(b => b.booking_date === todayStr)
  const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length
  const completedCount = allBookings.filter(b => b.status === 'completed').length
  const cancelledCount = allBookings.filter(b => b.status === 'cancelled').length

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'Poppins', sans-serif", minHeight: '100vh', background: '#F4F4F2' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>Bookings</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: '4px 0 0' }}>
            {today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal(todayStr, '')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer2 2.6s infinite linear',
            border: '1.5px solid rgba(201,169,110,0.6)',
            borderRadius: 6, color: '#1C1C1C',
            fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
          }}
        >
          + Add Booking
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Today', value: todayBookings.length, sub: 'appointments' },
          { label: 'Confirmed', value: confirmedCount, sub: 'upcoming' },
          { label: 'Completed', value: completedCount, sub: 'all time' },
          { label: 'Cancelled', value: cancelledCount, sub: 'all time' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 10, padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1C1C1C', margin: '0 0 2px', lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.3)', margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Calendar panel */}
      <div style={{
        background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={() => setCurrentDate(new Date())}
              style={{
                padding: '6px 14px', borderRadius: 6,
                border: '1.5px solid rgba(0,0,0,0.12)',
                background: '#FFFFFF', color: '#1C1C1C',
                fontSize: '0.75rem', fontWeight: 500,
                cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
              }}>
              Today
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['‹', '›'] as const).map((arrow, i) => (
                <button key={arrow} type="button" onClick={() => navigate(i === 0 ? -1 : 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: '1.5px solid rgba(0,0,0,0.12)',
                    background: '#FFFFFF', color: '#1C1C1C',
                    fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {arrow}
                </button>
              ))}
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
              {getHeaderLabel()}
            </h2>
          </div>

          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 3 }}>
            {(['day', 'week', 'month'] as const).map(v => (
              <button key={v} type="button" onClick={() => setCalView(v)}
                style={{
                  padding: '6px 16px', borderRadius: 6, border: 'none',
                  background: calView === v ? '#FFFFFF' : 'transparent',
                  color: calView === v ? '#1C1C1C' : 'rgba(0,0,0,0.45)',
                  fontSize: '0.78rem', fontWeight: calView === v ? 600 : 400,
                  cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                  boxShadow: calView === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease', textTransform: 'capitalize',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── DAY VIEW ── */}
        {calView === 'day' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(0,0,0,0.3)', fontSize: '0.85rem' }}>
              Loading...
            </div>
          ) : (
            <div>
              {TIME_SLOTS.map(slot => {
                const booking = bookings.find(b => b.booking_time.slice(0, 5) === slot)
                const sc = booking ? STATUS_CONFIG[booking.status] : null
                return (
                  <div key={slot} style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 60 }}>
                    <div style={{
                      width: 80, flexShrink: 0, padding: '20px 16px 0',
                      fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', fontWeight: 500,
                      textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {formatTime(slot + ':00')}
                    </div>
                    <div
                      style={{ flex: 1, padding: '8px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => booking ? setSelectedBooking(booking) : openAddModal(currentDate.toISOString().split('T')[0], slot)}
                    >
                      {booking ? (
                        <div style={{
                          background: sc?.bg, border: `1.5px solid ${sc?.border}`,
                          borderRadius: 6, padding: '8px 16px', width: '100%',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 2px' }}>
                              {booking.users?.name}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
                              {booking.services?.name_en} · {formatTime(booking.booking_time)} – {formatTime(booking.end_time)}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 600, color: sc?.color,
                            background: 'rgba(255,255,255,0.8)', padding: '2px 8px',
                            borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {sc?.label}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '100%', height: 44, borderRadius: 6,
                            border: '1.5px dashed transparent',
                            display: 'flex', alignItems: 'center', paddingLeft: 12,
                            transition: 'border-color 0.15s ease',
                          }}
                          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
                          onMouseOut={e => (e.currentTarget.style.borderColor = 'transparent')}
                        >
                          <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.15)', margin: 0 }}>+ Available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── WEEK VIEW ── */}
        {calView === 'week' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }} />
              {getWeekDays(currentDate).map((day, i) => {
                const dStr = day.toISOString().split('T')[0]
                const isToday = dStr === todayStr
                return (
                  <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 6 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {day.toLocaleDateString('en-MY', { weekday: 'short' })}
                    </p>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isToday ? '#C9A96E' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                    }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: isToday ? 700 : 400, color: '#1C1C1C', margin: 0 }}>
                        {day.getDate()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {TIME_SLOTS.map(slot => (
              <div key={slot} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 56 }}>
                <div style={{ padding: '16px 16px 0', fontSize: '0.7rem', color: 'rgba(0,0,0,0.35)', fontWeight: 500, textAlign: 'right', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
                  {formatTime(slot + ':00')}
                </div>
                {getWeekDays(currentDate).map((day, i) => {
                  const dStr = day.toISOString().split('T')[0]
                  const booking = bookings.find(b => b.booking_date === dStr && b.booking_time.slice(0, 5) === slot)
                  const sc = booking ? STATUS_CONFIG[booking.status] : null
                  return (
                    <div key={i}
                      style={{ padding: '4px', borderRight: i < 6 ? '1px solid rgba(0,0,0,0.04)' : 'none', cursor: 'pointer' }}
                      onClick={() => booking ? setSelectedBooking(booking) : openAddModal(dStr, slot)}
                    >
                      {booking && sc && (
                        <div style={{
                          background: sc.bg, border: `1.5px solid ${sc.border}`,
                          borderRadius: 4, padding: '4px 8px', height: '100%',
                        }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.users?.name}
                          </p>
                          <p style={{ fontSize: '0.68rem', color: 'rgba(0,0,0,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.services?.name_en}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {calView === 'month' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {d}
                </div>
              ))}
            </div>

            {(() => {
              const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
              const weeks: (Date | null)[][] = []
              for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
              return weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {week.map((day, di) => {
                    if (!day) return (
                      <div key={di} style={{ minHeight: 100, background: 'rgba(0,0,0,0.015)', borderRight: di < 6 ? '1px solid rgba(0,0,0,0.04)' : 'none' }} />
                    )
                    const dStr = day.toISOString().split('T')[0]
                    const dayBookings = bookings.filter(b => b.booking_date === dStr)
                    const isToday = dStr === todayStr
                    return (
                      <div key={di}
                        style={{
                          minHeight: 100, padding: '8px',
                          borderRight: di < 6 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                          background: isToday ? 'rgba(201,169,110,0.04)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => { if (dayBookings.length === 0) openAddModal(dStr, '11:00') }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: isToday ? '#C9A96E' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                        }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: isToday ? 700 : 400, color: '#1C1C1C' }}>
                            {day.getDate()}
                          </span>
                        </div>
                        {dayBookings.slice(0, 3).map(b => {
                          const sc = STATUS_CONFIG[b.status]
                          return (
                            <div key={b.id}
                              onClick={e => { e.stopPropagation(); setSelectedBooking(b) }}
                              style={{
                                background: sc.bg, border: `1px solid ${sc.border}`,
                                borderRadius: 3, padding: '2px 6px', marginBottom: 2, cursor: 'pointer',
                              }}>
                              <p style={{ fontSize: '0.68rem', fontWeight: 500, color: '#1C1C1C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formatTime(b.booking_time)} {b.users?.name}
                              </p>
                            </div>
                          )
                        })}
                        {dayBookings.length > 3 && (
                          <p style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.4)', margin: '2px 0 0' }}>
                            +{dayBookings.length - 3} more
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* ── BOOKING DETAIL PANEL ── */}
      {selectedBooking && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }}
            onClick={() => setSelectedBooking(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
            background: '#FFFFFF', zIndex: 101,
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Poppins',sans-serif",
          }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
                  Appointment Details
                </h2>
                <button type="button" onClick={() => setSelectedBooking(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', fontSize: '1.2rem', padding: 4 }}>
                  ✕
                </button>
              </div>
              <span style={{
                display: 'inline-block', marginTop: 8,
                fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: STATUS_CONFIG[selectedBooking.status]?.color,
                background: STATUS_CONFIG[selectedBooking.status]?.bg,
                border: `1px solid ${STATUS_CONFIG[selectedBooking.status]?.border}`,
                padding: '3px 10px', borderRadius: 4,
              }}>
                {STATUS_CONFIG[selectedBooking.status]?.label}
              </span>
            </div>

            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Customer</p>
                <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>
                    {selectedBooking.users?.name || 'Unknown'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.45)', margin: '0 0 2px' }}>
                    📱 {selectedBooking.users?.phone}
                  </p>
                  {selectedBooking.users?.email && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                      ✉️ {selectedBooking.users.email}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Service</p>
                <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>
                    ✂️ {selectedBooking.services?.name_en}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.45)', margin: '0 0 2px' }}>
                    ⏱ {selectedBooking.services?.duration_minutes} minutes
                  </p>
                  {selectedBooking.services?.price_from && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                      💰 From RM {selectedBooking.services.price_from}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Date & Time</p>
                <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>
                    🗓 {formatDate(selectedBooking.booking_date)}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                    🕐 {formatTime(selectedBooking.booking_time)}
                    {selectedBooking.end_time ? ` – ${formatTime(selectedBooking.end_time)}` : ''}
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Notes</p>
                  <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '14px 16px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#1C1C1C', margin: 0, lineHeight: 1.6 }}>{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedBooking.status === 'confirmed' && (
              <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button type="button"
                  onClick={() => updateStatus(selectedBooking.id, 'completed')}
                  disabled={!!updatingId}
                  style={{
                    padding: '12px', background: '#4CAF50', border: 'none',
                    borderRadius: 6, color: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600,
                    cursor: updatingId ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
                    opacity: updatingId ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {updatingId === selectedBooking.id ? <Spinner size={14} color="#fff" /> : null}
                  ✓ Mark as Complete
                </button>
                <button type="button"
                  onClick={() => updateStatus(selectedBooking.id, 'no_show')}
                  disabled={!!updatingId}
                  style={{
                    padding: '12px', background: 'transparent', border: '1.5px solid #FF9800',
                    borderRadius: 6, color: '#FF9800', fontSize: '0.82rem', fontWeight: 600,
                    cursor: updatingId ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
                    opacity: updatingId ? 0.6 : 1,
                  }}>
                  No Show
                </button>
                <button type="button"
                  onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                  disabled={!!updatingId}
                  style={{
                    padding: '12px', background: 'transparent', border: '1.5px solid #E57373',
                    borderRadius: 6, color: '#E57373', fontSize: '0.82rem', fontWeight: 600,
                    cursor: updatingId ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
                    opacity: updatingId ? 0.6 : 1,
                  }}>
                  Cancel Appointment
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ADD BOOKING MODAL ── */}
      {showAddModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
            onClick={() => { setShowAddModal(false); resetAddForm() }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%', maxWidth: 520,
            background: '#FFFFFF', borderRadius: 12,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            zIndex: 101, maxHeight: '90vh', overflowY: 'auto',
            fontFamily: "'Poppins',sans-serif",
          }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>Add Appointment</h2>
              <button type="button" onClick={() => { setShowAddModal(false); resetAddForm() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', fontSize: '1.2rem', padding: 4 }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* Customer */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Customer *
                </label>

                {!selectedCustomer && !isNewCustomer && (
                  <>
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={customerSearch}
                      onChange={e => handleSearchCustomer(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px',
                        border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                        fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
                        outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                    />
                    {customerResults.length > 0 && (
                      <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, marginTop: 4, overflow: 'hidden' }}>
                        {customerResults.map(c => (
                          <div key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#FFFFFF' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#F8F8F6')}
                            onMouseOut={e => (e.currentTarget.style.background = '#FFFFFF')}
                          >
                            <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 2px' }}>{c.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>{c.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => setIsNewCustomer(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A96E', fontSize: '0.78rem', padding: '8px 0 0', fontFamily: "'Poppins',sans-serif" }}>
                      + New customer
                    </button>
                  </>
                )}

                {selectedCustomer && (
                  <div style={{ background: 'rgba(201,169,110,0.08)', border: '1.5px solid rgba(201,169,110,0.3)', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 2px' }}>{selectedCustomer.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>{selectedCustomer.phone}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedCustomer(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.3)', fontSize: '0.9rem' }}>✕</button>
                  </div>
                )}

                {isNewCustomer && (
                  <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '16px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#C9A96E', margin: '0 0 12px' }}>New Customer</p>
                    {[
                      { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Customer name' },
                      { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '11-2345 6789' },
                      { label: 'Email', key: 'email', type: 'email', placeholder: 'optional' },
                    ].map(field => (
                      <div key={field.key} style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.45)', display: 'block', marginBottom: 4 }}>{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={newCustomer[field.key as keyof typeof newCustomer]}
                          onChange={e => setNewCustomer(prev => ({ ...prev, [field.key]: e.target.value }))}
                          style={{
                            width: '100%', padding: '8px 12px',
                            border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 6,
                            fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif",
                            outline: 'none', boxSizing: 'border-box', background: '#FFFFFF',
                          }}
                        />
                      </div>
                    ))}
                    <button type="button" onClick={() => { setIsNewCustomer(false); setNewCustomer({ name: '', phone: '', countryCode: '+60', email: '' }) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', fontSize: '0.75rem', padding: 0, fontFamily: "'Poppins',sans-serif" }}>
                      ← Back to search
                    </button>
                  </div>
                )}
              </div>

              {/* Service */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                    fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
                    outline: 'none', background: '#FAFAFA', color: '#1C1C1C',
                    cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(0,0,0,0.4)' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem',
                  }}
                >
                  <option value="">Select a service...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name_en} ({s.duration_minutes} min{s.price_from ? ` · From RM${s.price_from}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={addSlotDate}
                  onChange={e => setAddSlotDate(e.target.value)}
                  min={todayStr}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                    fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
                    outline: 'none', background: '#FAFAFA', color: '#1C1C1C', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Time */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Time *
                </label>
                <select
                  value={addSlotTime}
                  onChange={e => setAddSlotTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                    fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
                    outline: 'none', background: '#FAFAFA',
                    color: addSlotTime ? '#1C1C1C' : 'rgba(0,0,0,0.4)',
                    cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(0,0,0,0.4)' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem',
                  }}
                >
                  <option value="">Select a time...</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{formatTime(slot + ':00')}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Notes (optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                    fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
                    outline: 'none', background: '#FAFAFA', color: '#1C1C1C',
                    boxSizing: 'border-box', resize: 'vertical',
                  }}
                />
              </div>

              {addError && (
                <p style={{ color: '#E53935', fontSize: '0.8rem', marginBottom: 16, textAlign: 'center' }}>
                  {addError}
                </p>
              )}

              <button
                type="button"
                onClick={handleAddBooking}
                disabled={addingBooking}
                style={{
                  width: '100%', padding: '13px',
                  background: addingBooking
                    ? 'rgba(201,169,110,0.4)'
                    : 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)',
                  backgroundSize: '200% 100%',
                  animation: addingBooking ? 'none' : 'shimmer2 2.6s infinite linear',
                  border: '1.5px solid rgba(201,169,110,0.6)',
                  borderRadius: 6, color: '#1C1C1C',
                  fontSize: '0.82rem', fontWeight: 600,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: addingBooking ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Poppins',sans-serif",
                }}
              >
                {addingBooking ? (
                  <>
                    <Spinner size={16} color="#1C1C1C" />
                    Creating...
                  </>
                ) : (
                  'Create Appointment'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes shimmer2 {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
