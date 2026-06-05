'use client'
import { useState, useEffect, useCallback } from 'react'

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

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = view === 'calendar'
        ? `date=${selectedDate}`
        : `filter=${filter}`
      const res = await fetch(`/api/admin/bookings?${params}`)
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, selectedDate, view])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  async function updateBookingStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        await fetchBookings()
      }
    } catch (err) {
      console.error('Failed to update booking:', err)
    } finally {
      setUpdatingId(null)
    }
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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Confirmed', color: '#C9A96E', bg: 'rgba(201,169,110,0.1)' },
    completed: { label: 'Completed', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
    cancelled: { label: 'Cancelled', color: '#E57373', bg: 'rgba(229,115,115,0.1)' },
    no_show: { label: 'No Show', color: '#FF9800', bg: 'rgba(255,152,0,0.1)' },
  }

  const timeSlots = Array.from({ length: 19 }, (_, i) => {
    const totalMins = 11 * 60 + i * 30
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: '32px 40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
            Bookings
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['list', 'calendar'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1.5px solid',
                borderColor: view === v ? '#C9A96E' : 'rgba(0,0,0,0.12)',
                background: view === v ? 'rgba(201,169,110,0.08)' : '#FFFFFF',
                color: view === v ? '#C9A96E' : 'rgba(0,0,0,0.5)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif",
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
            >
              {v === 'list' ? '☰ List' : '📅 Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: "Today's Bookings", value: bookings.filter(b => b.booking_date === today).length },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
          { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 8,
            padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 600, color: '#1C1C1C', margin: 0, lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs / date picker */}
      {view === 'list' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['today', 'upcoming', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: filter === f ? '#C9A96E' : 'rgba(0,0,0,0.1)',
                background: filter === f ? '#C9A96E' : '#FFFFFF',
                color: filter === f ? '#1C1C1C' : 'rgba(0,0,0,0.5)',
                fontSize: '0.78rem',
                fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif",
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
            >
              {f === 'today' ? 'Today' : f === 'upcoming' ? 'Upcoming' : 'All Bookings'}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontFamily: "'Poppins',sans-serif",
              outline: 'none',
              color: '#1C1C1C',
            }}
          />
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} on this day
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(0,0,0,0.3)', fontSize: '0.85rem' }}>
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 0',
          background: '#FFFFFF', borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>📅</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>
            No bookings found
          </p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>
            {filter === 'today' ? 'No appointments scheduled for today.' : 'No bookings match this filter.'}
          </p>
        </div>
      ) : view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(booking => {
            const sc = statusConfig[booking.status] || statusConfig.confirmed
            const isUpdating = updatingId === booking.id
            return (
              <div key={booking.id} style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 8,
                padding: '20px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
                      {booking.users?.name || 'Unknown Customer'}
                    </h3>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: sc.color, background: sc.bg,
                      padding: '2px 8px', borderRadius: 3,
                    }}>
                      {sc.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.5)', margin: '0 0 4px' }}>
                    📱 {booking.users?.phone}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.5)', margin: '0 0 4px' }}>
                    ✂️ {booking.services?.name_en} · {booking.services?.duration_minutes} min
                    {booking.services?.price_from ? ` · From RM ${booking.services.price_from}` : ''}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#C9A96E', fontWeight: 500, margin: 0 }}>
                    🗓 {formatDate(booking.booking_date)} · {formatTime(booking.booking_time)}
                    {booking.end_time ? ` – ${formatTime(booking.end_time)}` : ''}
                  </p>
                </div>

                {booking.status === 'confirmed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      disabled={isUpdating}
                      style={{
                        padding: '7px 16px',
                        background: '#4CAF50',
                        border: 'none',
                        borderRadius: 6,
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      {isUpdating ? '...' : '✓ Complete'}
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'no_show')}
                      disabled={isUpdating}
                      style={{
                        padding: '7px 16px',
                        background: 'transparent',
                        border: '1.5px solid #FF9800',
                        borderRadius: 6,
                        color: '#FF9800',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      disabled={isUpdating}
                      style={{
                        padding: '7px 16px',
                        background: 'transparent',
                        border: '1.5px solid #E57373',
                        borderRadius: 6,
                        color: '#E57373',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {timeSlots.map(slot => {
            const booking = bookings.find(b => b.booking_time.slice(0, 5) === slot)
            return (
              <div key={slot} style={{
                display: 'flex',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                minHeight: 56,
              }}>
                <div style={{
                  width: 80,
                  flexShrink: 0,
                  padding: '16px 12px',
                  borderRight: '1px solid rgba(0,0,0,0.06)',
                  fontSize: '0.72rem',
                  color: 'rgba(0,0,0,0.35)',
                  fontWeight: 500,
                  textAlign: 'right',
                }}>
                  {formatTime(slot)}
                </div>

                <div style={{ flex: 1, padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                  {booking ? (
                    <div style={{
                      background: 'rgba(201,169,110,0.1)',
                      border: '1.5px solid rgba(201,169,110,0.3)',
                      borderRadius: 6,
                      padding: '8px 16px',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 2px' }}>
                          {booking.users?.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                          {booking.services?.name_en} · {booking.services?.duration_minutes} min
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600,
                        color: statusConfig[booking.status]?.color,
                        background: statusConfig[booking.status]?.bg,
                        padding: '2px 8px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {statusConfig[booking.status]?.label}
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.15)', margin: 0 }}>
                      Available
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
