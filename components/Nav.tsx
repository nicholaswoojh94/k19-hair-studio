'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'

interface NavProps {
  hideBookNow?: boolean
}

const HIDE_BOOK_NOW_PATHS = ['/booking', '/login', '/register']

export default function Nav({ hideBookNow: hideBookNowProp = false }: NavProps) {
  const { t, lang, setLang } = useLang()
  const pathname = usePathname()
  const hideBookNow = hideBookNowProp || HIDE_BOOK_NOW_PATHS.includes(pathname)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('#langSwitcher')) setLangOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const langLabel = lang === 'en' ? 'EN' : lang === 'bm' ? 'BM' : '中文'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(28,28,28,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,169,110,0.15)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="K19 Hair Studio Home" className="flex-shrink-0">
          <Image
            src="/brand_assets/K19_logo_white_transparent.png"
            alt="K19 Hair Studio"
            width={200}
            height={48}
            style={{ height: 48, width: 'auto' }}
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

          {!hideBookNow && (
            <Link href="/booking" className="btn-gold ml-4">{t('navBook')}</Link>
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

      {/* Mobile menu */}
      <div
        className={`mobile-menu px-6 pb-5 gap-4 bg-ink border-t ${menuOpen ? 'open' : ''}`}
        style={{ borderColor: 'rgba(201,169,110,0.1)' }}
      >
        <Link href="/#services" className="nav-link py-2" onClick={() => setMenuOpen(false)}>{t('navServices')}</Link>
        <Link href="/#gallery" className="nav-link py-2" onClick={() => setMenuOpen(false)}>{t('navGallery')}</Link>
        <Link href="/#about" className="nav-link py-2" onClick={() => setMenuOpen(false)}>{t('navAbout')}</Link>
        {!hideBookNow && (
          <Link href="/booking" className="btn-gold mt-2 text-center" onClick={() => setMenuOpen(false)}>{t('navBook')}</Link>
        )}
      </div>
    </nav>
  )
}
