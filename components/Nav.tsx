'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { UserRound } from 'lucide-react'
import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'

interface NavProps {
  hideBookNow?: boolean
}

interface K19User {
  phone: string
  name: string
  email: string
  birthday: string
}

const HIDE_ALL_PATHS = ['/login', '/register']
const HIDE_BOOK_NOW_ONLY_PATHS = ['/booking', '/appointments']

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function Nav({ hideBookNow: hideBookNowProp = false }: NavProps) {
  const { t, lang, setLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()

  const hideAll = HIDE_ALL_PATHS.includes(pathname)
  const hideBookNow = hideAll || hideBookNowProp || HIDE_BOOK_NOW_ONLY_PATHS.includes(pathname)

  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<K19User | null>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Re-read user on every route change so nav updates after login/logout
  useEffect(() => {
    try {
      const stored = localStorage.getItem('k19_user')
      if (stored) {
        const u = JSON.parse(stored)
        setUser(u)

        // Fetch real loyalty balance
        if (u.id) {
          fetch(`/api/loyalty?userId=${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.balance !== undefined) {
                setLoyaltyPoints(data.balance)
              }
            })
            .catch(() => {
              // Fall back to localStorage if fetch fails
              const pts = localStorage.getItem('k19_loyalty')
              setLoyaltyPoints(pts ? parseInt(pts, 10) || 0 : 0)
            })
        } else {
          setLoyaltyPoints(0)
        }
      } else {
        setUser(null)
        setLoyaltyPoints(0)
      }
    } catch { /* ignore */ }
  }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('#langSwitcher')) setLangOpen(false)
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function handleLogout() {
    try {
      localStorage.removeItem('k19_user')
      localStorage.removeItem('k19_loyalty')
    } catch { /* ignore */ }
    setUser(null)
    setProfileOpen(false)
    setMenuOpen(false)
    router.push('/')
  }

  const langLabel = lang === 'en' ? 'EN' : lang === 'bm' ? 'BM' : '中文'
  const showAvatar = !hideAll && !!user
  const showBookNow = !hideBookNow && !user
  const initials = user?.name ? getInitials(user.name) : null

  const menuItems = [
    {
      label: 'My Appointments',
      href: '/appointments',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Loyalty Points',
      href: '/loyalty',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      badge: `${loyaltyPoints} pts`,
    },
    {
      label: 'Rewards & Vouchers',
      href: '/rewards',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
    },
    {
      label: 'My Profile',
      href: '/profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: 'Invite a Friend',
      href: '/invite',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 150,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: menuOpen ? 'blur(4px)' : 'none',
        }}
      />
    <nav
      className="fixed top-0 left-0 right-0 z-[100]"
      style={{
        paddingTop: isScrolled ? '6px' : '16px',
        paddingBottom: isScrolled ? '6px' : '16px',
        background: isScrolled ? 'rgba(18,18,18,0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        boxShadow: isScrolled ? '0 1px 0 rgba(201,169,110,0.1)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="K19 Hair Studio Home" className="flex-shrink-0">
          <Image
            src="/brand_assets/K19_logo_white_transparent.png"
            alt="K19 Hair Studio"
            width={260}
            height={80}
            className="nav-logo"
            style={{ width: isScrolled ? '120px' : '160px', height: 'auto', transition: 'width 0.3s ease', maxWidth: '160px' }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-nav flex items-center gap-8">
          <Link href="/#services" className="nav-link">{t('navServices')}</Link>
          <Link href="/#gallery" className="nav-link">{t('navGallery')}</Link>
          <Link href="/#about" className="nav-link">{t('navAbout')}</Link>

          {/* Language switcher */}
          <div className="relative" id="langSwitcher">
            <button
              onClick={() => setLangOpen(v => !v)}
              className="nav-link flex items-center gap-1"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span>{langLabel}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#1C1C1C', border: '1px solid rgba(201,169,110,0.2)',
                borderRadius: 4, minWidth: 120, padding: '6px 0', zIndex: 200,
              }}>
                {(['en', 'bm', 'zh'] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 16px', fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.78rem', color: 'rgba(250,250,248,0.7)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
                    onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.7)')}
                  >
                    {l === 'en' ? 'English' : l === 'bm' ? 'Bahasa Malaysia' : '中文'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showBookNow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: '1rem' }}>
              <button
                title="Login"
                onClick={() => router.push('/login')}
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'transparent', border: '1px solid rgba(201,169,110,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.8)'; e.currentTarget.style.background = 'rgba(201,169,110,0.08)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)'; e.currentTarget.style.background = 'transparent' }}
              >
                <UserRound size={16} color="#C9A96E" />
              </button>
              <Link href="/booking" className="btn-gold">{t('navBook')}</Link>
            </div>
          )}

          {/* Profile avatar + dropdown */}
          {showAvatar && (
            <div className="relative" ref={profileRef} style={{ marginLeft: '1rem' }}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: 'linear-gradient(135deg, #C9A96E, #A8833E)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#1C1C1C',
                  transition: 'box-shadow 0.2s ease',
                  boxShadow: profileOpen ? '0 0 0 2px rgba(201,169,110,0.6)' : 'none',
                }}
                onMouseOver={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(201,169,110,0.6)')}
                onMouseOut={e => { if (!profileOpen) e.currentTarget.style.boxShadow = 'none' }}
              >
                {initials ?? <UserRound size={16} color="#1C1C1C" />}
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#1C1C1C', border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 6, minWidth: 220,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  padding: '8px 0', zIndex: 200,
                }}>
                  {/* Dropdown header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#FAFAF8', margin: 0 }}>
                      {user?.name || 'K19 Member'}
                    </p>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem', color: 'rgba(250,250,248,0.4)', margin: '2px 0 0' }}>
                      {user?.phone || ''}
                    </p>
                  </div>

                  {/* Menu items */}
                  {menuItems.map(item => (
                    <button
                      key={item.href}
                      onClick={() => { setProfileOpen(false); router.push(item.href) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 16px', fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem',
                        color: 'rgba(250,250,248,0.7)', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.color = '#C9A96E' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(250,250,248,0.7)' }}
                    >
                      {item.icon}
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span style={{ fontSize: '0.72rem', color: '#C9A96E', fontWeight: 500 }}>{item.badge}</span>
                      )}
                    </button>
                  ))}

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', margin: '4px 0' }}/>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 16px', fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem',
                      color: 'rgba(250,250,248,0.4)', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.color = '#E57373' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(250,250,248,0.4)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="mobile-menu-btn hidden items-center justify-center w-10 h-10 text-white focus:outline-none"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <path d="M0 1h22M0 8h22M0 15h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

    </nav>

      {/* Mobile slide-in menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          background: '#1C1C1C',
          borderLeft: '1px solid rgba(201,169,110,0.15)',
          zIndex: 200,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 24px 32px',
          gap: '0',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(250,250,248,0.6)',
            padding: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Nav links */}
        <Link href="/#services" className="nav-link" style={{padding: '14px 0', borderBottom: '1px solid rgba(201,169,110,0.08)', fontSize: '0.85rem'}} onClick={() => setMenuOpen(false)}>{t('navServices')}</Link>
        <Link href="/#gallery" className="nav-link" style={{padding: '14px 0', borderBottom: '1px solid rgba(201,169,110,0.08)', fontSize: '0.85rem'}} onClick={() => setMenuOpen(false)}>{t('navGallery')}</Link>
        <Link href="/#about" className="nav-link" style={{padding: '14px 0', borderBottom: '1px solid rgba(201,169,110,0.08)', fontSize: '0.85rem'}} onClick={() => setMenuOpen(false)}>{t('navAbout')}</Link>

        {/* Logged out state */}
        {showBookNow && (
          <div style={{marginTop: '24px', display: 'flex', flexDirection: 'column', gap: 12}}>
            <button
              onClick={() => { router.push('/login'); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(250,250,248,0.7)', fontFamily: "'Poppins',sans-serif",
                fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '14px 0',
              }}
            >
              <UserRound size={16} color="#C9A96E" />
              Login
            </button>
            <Link href="/booking" className="btn-gold" style={{textAlign: 'center'}} onClick={() => setMenuOpen(false)}>{t('navBook')}</Link>
          </div>
        )}

        {/* Logged in state */}
        {showAvatar && (
          <div style={{marginTop: '16px'}}>
            <div style={{padding: '16px 0', borderBottom: '1px solid rgba(201,169,110,0.1)', marginBottom: '8px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9A96E, #A8833E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', fontWeight: 600, color: '#1C1C1C',
                  flexShrink: 0,
                }}>
                  {initials ?? <UserRound size={14} color="#1C1C1C" />}
                </div>
                <div>
                  <p style={{margin: 0, fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#FAFAF8'}}>{user?.name || 'K19 Member'}</p>
                  <p style={{margin: 0, fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.4)'}}>{user?.phone || ''}</p>
                </div>
              </div>
            </div>

            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 0',
                  borderBottom: '1px solid rgba(201,169,110,0.06)',
                  color: 'rgba(250,250,248,0.7)',
                  textDecoration: 'none',
                  fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem',
                  transition: 'color 0.2s ease',
                }}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                <span style={{flex: 1}}>{item.label}</span>
                {'badge' in item && item.badge && (
                  <span style={{fontSize: '0.72rem', color: '#C9A96E'}}>{item.badge}</span>
                )}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', background: 'none', border: 'none',
                cursor: 'pointer', padding: '16px 0', marginTop: '8px',
                color: '#E57373', fontFamily: "'Poppins',sans-serif",
                fontSize: '0.82rem', textAlign: 'left',
                transition: 'color 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
