'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/context/LanguageContext'

export default function AppointmentsPage() {
  const { t } = useLang()
  const [userName, setUserName] = useState('')
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [historyBookings, setHistoryBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('k19_user')
      if (stored) {
        const u = JSON.parse(stored)
        setUserName(u.name ? u.name.split(' ')[0] : '')

        if (u.id) {
          fetch(`/api/bookings/user?userId=${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.bookings) {
                const today = new Date().toISOString().split('T')[0]

                const upcoming = data.bookings.filter((b: any) =>
                  b.status === 'confirmed' && b.booking_date >= today
                )

                const history = data.bookings.filter((b: any) =>
                  b.status === 'completed' ||
                  b.status === 'cancelled' ||
                  b.status === 'no_show' ||
                  (b.status === 'confirmed' && b.booking_date < today)
                ).reverse()

                setUpcomingBookings(upcoming)
                setHistoryBookings(history)
              }
            })
            .catch(err => console.error('Failed to fetch bookings:', err))
            .finally(() => setLoadingBookings(false))
        } else {
          setLoadingBookings(false)
        }
      } else {
        const legacy = localStorage.getItem('k19-user-name')
        if (legacy) setUserName(legacy.split(' ')[0])
        setLoadingBookings(false)
      }
    } catch {
      setLoadingBookings(false)
    }
    setTimeout(() => setVisible(true), 80)
  }, [])

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId)
    setCancelError(null)
    try {
      const stored = localStorage.getItem('k19_user')
      if (!stored) return
      const user = JSON.parse(stored)

      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await res.json()
      if (!res.ok) {
        setCancelError(data.error || 'Failed to cancel booking.')
      } else {
        // Refresh bookings
        if (user.id) {
          const res2 = await fetch(`/api/bookings/user?userId=${user.id}`)
          const data2 = await res2.json()
          if (data2.bookings) {
            const today = new Date().toISOString().split('T')[0]
            setUpcomingBookings(data2.bookings.filter((b: any) =>
              b.status === 'confirmed' && b.booking_date >= today
            ))
            setHistoryBookings(data2.bookings.filter((b: any) =>
              b.status === 'completed' ||
              b.status === 'cancelled' ||
              b.status === 'no_show' ||
              (b.status === 'confirmed' && b.booking_date < today)
            ).reverse())
          }
        }
      }
    } finally {
      setCancellingId(null)
    }
  }

  const hour = new Date().getHours()
  const greetKey = hour < 12 ? 'apptGreetMorning' : hour < 18 ? 'apptGreetAfternoon' : 'apptGreetEvening'

  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', paddingTop: '200px', paddingBottom: '80px' }}>
      <div className="appointments-content" style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {/* Greeting */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
          marginBottom: '2rem',
        }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem,5vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {t(greetKey)}{userName ? `, ${userName}` : ''}.
          </h1>
          <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
        </div>

        {/* Book Now banner */}
        <div style={{
          background: 'linear-gradient(135deg, #242424, #2A2A2A)',
          border: '1px solid rgba(201,169,110,0.2)',
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{
              fontFamily: "'Lora',serif",
              fontSize: '1rem',
              fontStyle: 'italic',
              color: '#FAFAF8',
              margin: '0 0 4px',
            }}>
              Ready for your next visit?
            </p>
            <p style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: '0.78rem',
              color: 'rgba(250,250,248,0.4)',
              margin: 0,
              fontWeight: 300,
            }}>
              Book an appointment in under 2 minutes.
            </p>
          </div>
          <Link
            href="/booking"
            className="btn-gold"
            style={{
              fontSize: '0.72rem',
              height: 40,
              padding: '0 20px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginLeft: 16,
            }}
          >
            Book Now
          </Link>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '1.5rem', marginBottom: '1.5rem',
          opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease 0.1s',
        }}>
          {(['upcoming', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px',
                fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem',
                color: activeTab === tab ? '#C9A96E' : 'rgba(250,250,248,0.4)',
                borderBottom: activeTab === tab ? '2px solid #C9A96E' : '2px solid transparent',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'History'}
            </button>
          ))}
        </div>

        {/* Upcoming tab */}
        {activeTab === 'upcoming' && (
          loadingBookings ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', color: 'rgba(250,250,248,0.3)' }}>
                Loading...
              </p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div style={{
              background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
              padding: '3rem 2rem', textAlign: 'center',
              opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
            }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="10" width="40" height="36" rx="4" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.5"/>
                  <line x1="6" y1="20" x2="46" y2="20" stroke="#C9A96E" strokeWidth="1.5" strokeOpacity="0.5"/>
                  <line x1="16" y1="6" x2="16" y2="16" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
                  <line x1="36" y1="6" x2="36" y2="16" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
                  <rect x="15" y="27" width="8" height="7" rx="1.5" fill="#C9A96E" fillOpacity="0.3" stroke="#C9A96E" strokeWidth="1" strokeOpacity="0.6"/>
                </svg>
              </div>
              <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 400, color: '#FAFAF8', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                {t('apptNoTitle')}
              </h2>
              <p className="font-sans" style={{ fontSize: '0.875rem', color: 'rgba(250,250,248,0.4)', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 340, margin: '0 auto 1.75rem' }}>
                {t('apptNoSub')}
              </p>
              <Link href="/booking" className="btn-gold" style={{ display: 'inline-flex' }}>{t('apptBookNow')}</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingBookings.map((booking: any) => (
                <div key={booking.id} style={{
                  background: '#242424',
                  border: '1px solid rgba(201,169,110,0.15)',
                  borderRadius: 8,
                  padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontFamily: "'Lora',serif", fontSize: '1.1rem', fontStyle: 'italic', color: '#FAFAF8', margin: 0 }}>
                        {booking.services?.name_en}
                      </p>
                      <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.4)', margin: '4px 0 0', fontWeight: 300 }}>
                        {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {booking.booking_time.slice(0, 5).replace(/^(\d+):(\d+)$/, (_: string, h: string, m: string) => {
                          const hour = parseInt(h)
                          const ampm = hour >= 12 ? 'pm' : 'am'
                          const h12 = hour > 12 ? hour - 12 : hour
                          return `${h12}:${m} ${ampm}`
                        })}
                      </p>
                    </div>
                    <span style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#C9A96E',
                      background: 'rgba(201,169,110,0.1)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      borderRadius: 3,
                      padding: '3px 8px',
                    }}>
                      Confirmed
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.3)', margin: 0, fontStyle: 'italic' }}>
                      Cancel up to 24hrs before your appointment
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(229,115,115,0.3)',
                        borderRadius: 4,
                        padding: '4px 12px',
                        color: 'rgba(229,115,115,0.7)',
                        fontSize: '0.72rem',
                        cursor: cancellingId === booking.id ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = '#E57373'
                        e.currentTarget.style.color = '#E57373'
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'rgba(229,115,115,0.3)'
                        e.currentTarget.style.color = 'rgba(229,115,115,0.7)'
                      }}
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
              {cancelError && (
                <div style={{
                  background: 'rgba(229,115,115,0.08)',
                  border: '1px solid rgba(229,115,115,0.2)',
                  borderRadius: 8, padding: '12px 16px', marginTop: 12,
                }}>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: '#E57373', margin: 0 }}>
                    {cancelError}
                  </p>
                </div>
              )}
            </div>
          )
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          loadingBookings ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', color: 'rgba(250,250,248,0.3)' }}>
                Loading...
              </p>
            </div>
          ) : historyBookings.length === 0 ? (
            <div style={{
              background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
              padding: '3rem 2rem', textAlign: 'center',
              opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
            }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 400, color: '#FAFAF8', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                No past appointments
              </h2>
              <p className="font-sans" style={{ fontSize: '0.875rem', color: 'rgba(250,250,248,0.4)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                Your appointment history will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {historyBookings.map((booking: any) => {
                const statusColors: Record<string, string> = {
                  completed: '#4CAF50',
                  cancelled: '#E57373',
                  no_show: '#FF9800',
                  confirmed: 'rgba(250,250,248,0.3)',
                }
                const statusLabels: Record<string, string> = {
                  completed: 'Completed',
                  cancelled: 'Cancelled',
                  no_show: 'No Show',
                  confirmed: 'Past',
                }
                return (
                  <div key={booking.id} style={{
                    background: '#1E1E1E',
                    border: '1px solid rgba(250,250,248,0.06)',
                    borderRadius: 8,
                    padding: '20px 24px',
                    opacity: 0.7,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontFamily: "'Lora',serif", fontSize: '1.1rem', fontStyle: 'italic', color: '#FAFAF8', margin: 0 }}>
                          {booking.services?.name_en}
                        </p>
                        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.4)', margin: '4px 0 0', fontWeight: 300 }}>
                          {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}
                          {booking.booking_time.slice(0, 5).replace(/^(\d+):(\d+)$/, (_: string, h: string, m: string) => {
                            const hour = parseInt(h)
                            const ampm = hour >= 12 ? 'pm' : 'am'
                            const h12 = hour > 12 ? hour - 12 : hour
                            return `${h12}:${m} ${ampm}`
                          })}
                        </p>
                      </div>
                      <span style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: statusColors[booking.status] || 'rgba(250,250,248,0.3)',
                        background: 'rgba(250,250,248,0.05)',
                        border: `1px solid ${statusColors[booking.status] || 'rgba(250,250,248,0.1)'}`,
                        borderRadius: 3,
                        padding: '3px 8px',
                      }}>
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

      </div>

      {/* Mobile sticky Book Now button */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'none', // hidden on desktop
      }} className="mobile-book-btn">
        <Link
          href="/booking"
          className="btn-gold"
          style={{
            fontSize: '0.8rem',
            height: 48,
            padding: '0 32px',
            borderRadius: 24,
            boxShadow: '0 4px 20px rgba(201,169,110,0.3), 0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          ✦ Book Appointment
        </Link>
      </div>
    </main>
  )
}
