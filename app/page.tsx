'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/context/LanguageContext'

/* ── Fade-up hook ── */
function useFadeUp() {
  useEffect(() => {
    const els = document.querySelectorAll('.fade-up')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ── Star SVG ── */
const Star = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="#C9A96E" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1l1.5 4H13L9.5 7.5l1.5 4.5L7 9.5 3 12l1.5-4.5L1 5h4.5z"/>
  </svg>
)

export default function HomePage() {
  const { t } = useLang()
  useFadeUp()

  /* Gallery caption hover */
  useEffect(() => {
    document.querySelectorAll('.gallery-item').forEach(item => {
      const cap = item.querySelector<HTMLElement>('div.caption')
      if (!cap) return
      item.addEventListener('mouseenter', () => { cap.style.opacity = '1' })
      item.addEventListener('mouseleave', () => { cap.style.opacity = '0' })
    })
  }, [])

  return (
    <>
      {/* ═══ HERO ═══════════════════════════════════════════════ */}
      <section
        className="hero-section grain relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ background: '#000' }}
      >
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ zIndex: 1, height: 180, background: 'linear-gradient(to bottom, transparent, #1C1C1C)' }}/>

        {/* Horizontal rule */}
        <div className="absolute left-0 right-0 pointer-events-none"
          style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.12), transparent)', margin: '0 auto', maxWidth: 800 }}/>
        </div>

        {/* Hero background photo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop"
            alt="K19 Hair Studio"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'grayscale(100%) contrast(1.05)',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%)',
          }} />
        </div>

        {/* Hero content */}
        <div className="relative flex flex-col items-center gap-5 max-w-2xl mx-auto" style={{ zIndex: 5, paddingTop: 80 }}>
          <h1 className="font-serif fade-up" style={{
            fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 500, fontStyle: 'italic',
            letterSpacing: '-0.02em', lineHeight: 1.1, color: '#FAFAF8',
            textShadow: '0 2px 32px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.7)',
            transitionDelay: '0.08s',
          }}>
            {t('heroTagline')}
          </h1>

          {/* Divider */}
          <div className="fade-up flex items-center gap-4 w-full justify-center" style={{ transitionDelay: '0.2s' }}>
            <span style={{ height: 1, width: 50, background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.5))' }}/>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2.5" fill="#C9A96E" opacity="0.9"/>
              <circle cx="6" cy="6" r="5" stroke="#C9A96E" strokeWidth="0.5" opacity="0.35"/>
            </svg>
            <span style={{ height: 1, width: 50, background: 'linear-gradient(to left, transparent, rgba(201,169,110,0.5))' }}/>
          </div>

          {/* CTAs */}
          <div className="fade-up flex flex-wrap gap-4 justify-center" style={{ transitionDelay: '0.28s' }}>
            <Link href="/booking" className="btn-gold">{t('heroCta1')}</Link>
            <Link href="/#services" className="btn-outline" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)', borderColor: 'rgba(250,250,248,0.7)', boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(250,250,248,0.1)', backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.2)' }}>{t('heroCta2')}</Link>
          </div>

          {/* Scroll hint */}
          <div className="fade-up flex flex-col items-center gap-2 mt-6" style={{ transitionDelay: '0.44s', opacity: 0.5 }}>
            <span className="font-sans text-xs tracking-widest uppercase" style={{ color: 'rgba(250,250,248,0.75)', textShadow: '0 1px 8px rgba(0,0,0,0.8), 0 2px 16px rgba(0,0,0,0.6)' }}>{t('heroDiscover')}</span>
            <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(201,169,110,0.7), transparent)' }}/>
          </div>
        </div>
      </section>


      {/* ═══ SERVICES ════════════════════════════════════════════ */}
      <section id="services" style={{ background: '#F5EFE6' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-up">
            <p className="font-sans text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(28,28,28,0.4)' }}>{t('servicesLabel')}</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', letterSpacing: '-0.03em', fontWeight: 400 }}>{t('servicesTitle')}</h2>
            <span className="gold-rule"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="service-card fade-up" style={{ transitionDelay: '0.08s' }}>
              <div className="mb-5">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="10" cy="10" r="4" stroke="#C9A96E" strokeWidth="1.5"/>
                  <circle cx="10" cy="26" r="4" stroke="#C9A96E" strokeWidth="1.5"/>
                  <line x1="13.5" y1="12.5" x2="27" y2="25" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="13.5" y1="23.5" x2="27" y2="11" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-serif text-ink mb-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{t('s1Title')}</h3>
              <span style={{ display: 'block', width: 32, height: 1.5, background: '#C9A96E', marginBottom: '0.85rem', borderRadius: 2 }}/>
              <p className="font-sans" style={{ fontSize: '0.875rem', lineHeight: 1.7, fontWeight: 300, color: 'rgba(28,28,28,0.6)' }}>{t('s1Desc')}</p>
            </div>

            {/* Card 2 */}
            <div className="service-card fade-up" style={{ transitionDelay: '0.16s' }}>
              <div className="mb-5">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 4 L22 16 Q24 20 22 24 Q20 29 18 30 Q16 29 14 24 Q12 20 14 16 Z" stroke="#C9A96E" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                  <path d="M12 8 Q6 14 8 22 Q10 28 18 30" stroke="#C9A96E" strokeWidth="1" fill="none" strokeDasharray="2,2"/>
                  <circle cx="18" cy="14" r="1.5" fill="#C9A96E" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="font-serif text-ink mb-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{t('s2Title')}</h3>
              <span style={{ display: 'block', width: 32, height: 1.5, background: '#C9A96E', marginBottom: '0.85rem', borderRadius: 2 }}/>
              <p className="font-sans" style={{ fontSize: '0.875rem', lineHeight: 1.7, fontWeight: 300, color: 'rgba(28,28,28,0.6)' }}>{t('s2Desc')}</p>
            </div>

            {/* Card 3 */}
            <div className="service-card fade-up" style={{ transitionDelay: '0.24s' }}>
              <div className="mb-5">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M18 6 Q24 10 26 18 Q28 26 18 30 Q8 26 10 18 Q12 10 18 6Z" stroke="#C9A96E" strokeWidth="1.5" fill="none"/>
                  <path d="M18 10 Q22 13 22 18 Q22 23 18 26 Q14 23 14 18 Q14 13 18 10Z" stroke="#C9A96E" strokeWidth="1" fill="rgba(201,169,110,0.08)"/>
                  <line x1="18" y1="6" x2="18" y2="2" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="23" y1="7.5" x2="25" y2="4" stroke="#C9A96E" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                  <line x1="13" y1="7.5" x2="11" y2="4" stroke="#C9A96E" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="font-serif text-ink mb-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{t('s3Title')}</h3>
              <span style={{ display: 'block', width: 32, height: 1.5, background: '#C9A96E', marginBottom: '0.85rem', borderRadius: 2 }}/>
              <p className="font-sans" style={{ fontSize: '0.875rem', lineHeight: 1.7, fontWeight: 300, color: 'rgba(28,28,28,0.6)' }}>{t('s3Desc')}</p>
            </div>
          </div>
        </div>
      </section>


      {/* ═══ WHY K19 ═════════════════════════════════════════════ */}
      <section id="about" style={{ background: '#242424', position: 'relative', overflow: 'hidden' }} className="py-24 px-6">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,169,110,0.05) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 fade-up">
            <p className="font-sans text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(250,250,248,0.3)' }}>{t('whyLabel')}</p>
            <h2 className="font-serif text-off-white mb-4" style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', letterSpacing: '-0.03em', fontWeight: 400 }}>{t('whyTitle')}</h2>
            <span className="gold-rule"/>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { num: '10+', key: 'stat1' }, { num: '500+', key: 'stat2' },
              { num: '★★',  key: 'stat3', serif: true }, { num: '100%', key: 'stat4' },
            ].map(({ num, key, serif }, i) => (
              <div key={key} className="text-center fade-up" style={{ transitionDelay: `${0.06 + i * 0.08}s` }}>
                <div className={serif ? 'font-serif' : 'stat-number'} style={serif ? { fontSize: '3rem', fontWeight: 400, color: '#C9A96E', letterSpacing: '-0.03em', lineHeight: 1 } : {}}>{num}</div>
                <div style={{ width: 24, height: 1, background: '#C9A96E', margin: '0.6rem auto 0.75rem', opacity: 0.5 }}/>
                <p className="font-sans text-sm" style={{ fontWeight: 300, lineHeight: 1.5, color: 'rgba(250,250,248,0.5)', whiteSpace: 'pre-line' }}>{t(key)}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center fade-up" style={{ transitionDelay: '0.1s' }}>
            <p className="font-serif italic" style={{ fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', maxWidth: 560, margin: '0 auto', lineHeight: 1.65, color: 'rgba(250,250,248,0.25)' }}>
              {t('quote')}
            </p>
          </div>
        </div>
      </section>


      {/* ═══ GALLERY ═════════════════════════════════════════════ */}
      <section id="gallery" style={{ background: '#F5EFE6' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-up">
            <p className="font-sans text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(28,28,28,0.4)' }}>{t('galleryLabel')}</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', letterSpacing: '-0.03em', fontWeight: 400 }}>{t('galleryTitle')}</h2>
            <span className="gold-rule"/>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { h: 320, src: 'https://placehold.co/480x640/2a1f14/c9a96e?text=Style',     label: 'Cuts & Style',   delay: '0.04s' },
              { h: 240, src: 'https://placehold.co/480x480/1a1208/c9a96e?text=Colour',    label: 'Colour',         delay: '0.10s' },
              { h: 320, src: 'https://placehold.co/480x640/231a10/c9a96e?text=Balayage',  label: 'Balayage',       delay: '0.16s' },
              { h: 260, src: 'https://placehold.co/480x520/1c1812/d4a5a0?text=Highlights',label: 'Highlights',     delay: '0.22s' },
              { h: 300, src: 'https://placehold.co/480x600/241b0e/c9a96e?text=Treatment', label: 'Treatment',      delay: '0.28s' },
              { h: 260, src: 'https://placehold.co/480x520/1e1610/c9a96e?text=Finish',    label: 'Finish',         delay: '0.34s' },
            ].map(({ h, src, label, delay }) => (
              <div key={label} className="gallery-item fade-up" style={{ height: h, transitionDelay: delay }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={label} loading="lazy"/>
                <div className="overlay"/>
                <div className="caption absolute bottom-0 left-0 right-0 p-4 z-10" style={{ opacity: 0, transition: 'opacity 0.35s ease' }}>
                  <p className="font-sans text-off-white text-xs tracking-widest uppercase">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ TESTIMONIALS ════════════════════════════════════════ */}
      <section style={{ background: '#FAFAF8' }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-up">
            <p className="font-sans text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(28,28,28,0.4)' }}>{t('testiLabel')}</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', letterSpacing: '-0.03em', fontWeight: 400 }}>{t('testiTitle')}</h2>
            <span className="gold-rule"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { q: '"I walked in unsure of what I wanted and walked out feeling completely transformed. The team at K19 truly listens."', name: 'Sophie T.', role: 'Regular Client', init: 'S', delay: '0.08s' },
              { q: '"Best balayage I\'ve ever had. The colour is so natural and the condition of my hair has never been better."', name: 'Maya L.', role: 'New Client', init: 'M', delay: '0.16s' },
              { q: '"The atmosphere, the expertise, the results — everything about K19 Hair Studio is five-star. Won\'t go anywhere else."', name: 'James K.', role: 'Returning Client', init: 'J', delay: '0.24s' },
            ].map(({ q, name, role, init, delay }) => (
              <div key={name} className="testimonial-card fade-up" style={{ transitionDelay: delay }}>
                <div className="flex gap-0.5 mb-4">{Array(5).fill(0).map((_, i) => <Star key={i}/>)}</div>
                <p className="font-serif italic mb-5" style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'rgba(28,28,28,0.7)' }}>{q}</p>
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,169,110,0.13), rgba(201,169,110,0.33))', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-serif text-sm" style={{ color: '#C9A96E' }}>{init}</span>
                  </div>
                  <div>
                    <p className="font-sans font-medium text-ink text-sm">{name}</p>
                    <p className="font-sans text-xs" style={{ color: 'rgba(28,28,28,0.4)' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ BOOKING CTA ═════════════════════════════════════════ */}
      <section id="booking" style={{ background: '#1C1C1C', position: 'relative', overflow: 'hidden' }} className="py-28 px-6">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,169,110,0.09) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.5), transparent)' }}/>

        <div className="max-w-2xl mx-auto text-center relative z-10 fade-up">
          <p className="font-sans text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,169,110,0.6)' }}>{t('bookLabel')}</p>
          <h2 className="font-serif text-off-white mb-5" style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', letterSpacing: '-0.03em', fontWeight: 400, lineHeight: 1.15 }}>
            {t('bookTitle')}<br/><em>{t('bookTitleEm')}</em>
          </h2>
          <p className="font-sans mb-10" style={{ fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 2.5rem', color: 'rgba(250,250,248,0.4)' }}>
            {t('bookDesc')}
          </p>
          <Link href="/booking" className="btn-gold" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', fontSize: '0.8rem' }}>
            {t('bookCta')}
          </Link>
        </div>
      </section>


      {/* ═══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: '#121212', borderTop: '1px solid rgba(201,169,110,0.08)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '72px 32px 48px' }}>

          {/* 3-column grid on desktop, single column on mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '64px',
            marginBottom: '48px',
            alignItems: 'flex-start',
          }}
          className="footer-grid"
          >

            {/* COLUMN 1 — Logo + tagline + Instagram */}
            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
              <div style={{ marginBottom: '20px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand_assets/K19_logo_white_transparent.png"
                  alt="K19 Hair Studio"
                  style={{ width: '180px', height: 'auto', display: 'block' }}
                />
              </div>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(250,250,248,0.4)',
                fontWeight: 300,
                lineHeight: 1.7,
                margin: '0 0 24px 0',
              }}>
                Premium hair studio dedicated to craftsmanship, creativity, and confidence.
              </p>
              <a
                href="https://www.instagram.com/k19_hairstudio/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
            </div>

            {/* COLUMN 2 — Business Hours */}
            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,250,248,0.3)',
                margin: '0 0 16px 0',
              }}>
                Business Hours
              </p>
              {[
                { day: 'Sunday', hours: '10:30am – 7pm' },
                { day: 'Monday', hours: '11am – 8pm' },
                { day: 'Tuesday', hours: 'Closed', closed: true },
                { day: 'Wednesday', hours: '11am – 8pm' },
                { day: 'Thursday', hours: '11am – 8pm' },
                { day: 'Friday', hours: '11am – 8pm' },
                { day: 'Saturday', hours: '10:30am – 8pm' },
              ].map(({ day, hours, closed }) => {
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day
                return (
                  <div key={day} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(201,169,110,0.06)',
                  }}>
                    <span style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.82rem',
                      fontWeight: isToday ? 500 : 300,
                      color: isToday ? '#C9A96E' : 'rgba(250,250,248,0.5)',
                    }}>
                      {isToday ? '✦ Today' : day}
                    </span>
                    <span style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.82rem',
                      fontWeight: isToday ? 500 : 300,
                      color: closed ? 'rgba(250,250,248,0.2)' : isToday ? '#C9A96E' : 'rgba(250,250,248,0.5)',
                    }}>
                      {hours}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* COLUMN 3 — Find Us */}
            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,250,248,0.3)',
                margin: '0 0 16px 0',
              }}>
                Find Us
              </p>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(250,250,248,0.5)',
                fontWeight: 300,
                lineHeight: 1.9,
                margin: '0 0 16px 0',
              }}>
                K19 Hair Studio<br/>
                P2-1-09, The Zizz, 2,<br/>
                Jalan PJU 10/1a, Damansara Damai,<br/>
                47830 Petaling Jaya, Selangor
              </p>
              <a href="tel:+601127785730" style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(201,169,110,0.7)',
                textDecoration: 'none',
                display: 'inline-block',
                marginBottom: '20px',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(201,169,110,0.7)')}>
                +60 11-2778 5730
              </a>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="https://share.google/Rq4Cle3KQWbN1ezVn" target="_blank" rel="noopener"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 4,
                    border: '1px solid rgba(201,169,110,0.3)',
                    background: 'rgba(201,169,110,0.06)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)'; e.currentTarget.style.background = 'rgba(201,169,110,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'; e.currentTarget.style.background = 'rgba(201,169,110,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#C9A96E"/>
                    <circle cx="12" cy="9" r="2.5" fill="#1C1C1C"/>
                  </svg>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#C9A96E' }}>Maps</span>
                </a>
                <a href="https://ul.waze.com/ul?place=ChIJwdJmyIpFzDERDwVvJS0CVXQ&ll=3.19819460%2C101.59607180&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location" target="_blank" rel="noopener"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 4,
                    border: '1px solid rgba(201,169,110,0.3)',
                    background: 'rgba(201,169,110,0.06)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)'; e.currentTarget.style.background = 'rgba(201,169,110,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'; e.currentTarget.style.background = 'rgba(201,169,110,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C7.5 2 4 5.8 4 10.3c0 2.4 1 4.5 2.5 6l.8 3.2 3-1.2c.5.1 1.1.2 1.7.2 4.5 0 8-3.8 8-8.2C20 5.8 16.5 2 12 2z" fill="#C9A96E"/>
                    <circle cx="9.5" cy="10" r="1.2" fill="#1C1C1C"/>
                    <circle cx="14.5" cy="10" r="1.2" fill="#1C1C1C"/>
                    <path d="M9 13s.8 1.5 3 1.5 3-1.5 3-1.5" stroke="#1C1C1C" strokeWidth="1" strokeLinecap="round" fill="none"/>
                  </svg>
                  <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#C9A96E' }}>Waze</span>
                </a>
              </div>
            </div>

          </div>

          {/* COPYRIGHT BAR */}
          <div style={{ height: 1, background: 'rgba(201,169,110,0.08)', marginBottom: '24px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.2)', margin: 0 }}>
              © 2026 K19 Hair Studio. All rights reserved.
            </p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.15)', margin: 0 }}>
              Crafted with care.
            </p>
          </div>

        </div>
      </footer>
    </>
  )
}

