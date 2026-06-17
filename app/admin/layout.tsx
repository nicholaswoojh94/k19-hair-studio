'use client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const navItems = [
    {
      label: 'Bookings',
      href: '/admin',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Customers',
      href: '/admin/customers',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Gallery',
      href: '/admin/gallery',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
    {
      label: 'Services',
      href: '/admin/services',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F4F2', fontFamily: "'Poppins', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#1C1C1C',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand_assets/K19_logo_white_transparent.png"
            alt="K19 Hair Studio"
            style={{ width: 140, height: 'auto' }}
          />
          <p style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.68rem',
            color: 'rgba(250,250,248,0.3)',
            margin: '8px 0 0',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Admin Dashboard
          </p>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <div key={item.href}>
                <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 24px',
                      color: isActive ? '#C9A96E' : 'rgba(250,250,248,0.6)',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(201,169,110,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid #C9A96E' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
              </div>
            )
          })}
        </nav>

        {/* Bottom — admin info + logout */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(201,169,110,0.1)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#FAFAF8', margin: '0 0 2px' }}>
            Kyan
          </p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(250,250,248,0.3)', margin: '0 0 12px' }}>
            Administrator
          </p>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(250,250,248,0.35)',
              fontSize: '0.78rem',
              padding: 0,
              transition: 'color 0.2s ease',
              fontFamily: "'Poppins',sans-serif",
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#E57373')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.35)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
