'use client'
import { useEffect, useRef, useState } from 'react'

type Notification = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

const POLL_INTERVAL_MS = 60000

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(dateString).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/admin/notifications/unread-count')
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count || 0)
    } catch {}
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleToggle() {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      try {
        const res = await fetch('/api/admin/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch {}
      fetchUnreadCount()
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36,
          background: 'transparent', border: 'none', borderRadius: 6,
          cursor: 'pointer', color: 'rgba(0,0,0,0.6)', padding: 0,
          transition: 'background 0.15s ease',
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            minWidth: 16, height: 16, padding: '0 4px',
            background: '#C62828', color: '#FFFFFF',
            borderRadius: 8, fontSize: '0.62rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Poppins',sans-serif", lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 340, maxWidth: '90vw',
          background: '#FFFFFF', borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          border: '1px solid rgba(0,0,0,0.06)',
          zIndex: 200, overflow: 'hidden',
          fontFamily: "'Poppins',sans-serif",
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>Notifications</p>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications === null ? (
              <p style={{ padding: '24px 18px', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p style={{ padding: '24px 18px', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                No notifications yet
              </p>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <p style={{ fontSize: '0.82rem', color: '#1C1C1C', margin: '0 0 4px', lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>{timeAgo(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
