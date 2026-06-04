'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/context/LanguageContext'

export default function AppointmentsPage() {
  const { t } = useLang()
  const [userName, setUserName] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('k19-user-name')
    if (stored) setUserName(stored.split(' ')[0]) // First name only
    setTimeout(() => setVisible(true), 80)
  }, [])

  const hour = new Date().getHours()
  const greetKey = hour < 12 ? 'apptGreetMorning' : hour < 18 ? 'apptGreetAfternoon' : 'apptGreetEvening'

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', paddingTop: 100, paddingBottom: 80 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
        {/* Greeting */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
          marginBottom: '2.5rem',
        }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem,5vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {t(greetKey)}{userName ? `, ${userName}` : ''}.
          </h1>
          <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
        </div>

        {/* Empty state card */}
        <div style={{
          background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
          padding: '3rem 2rem', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
        }}>
          {/* Calendar icon */}
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
      </div>
    </div>
  )
}
