'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RewardsPage() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', paddingTop: '200px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
          marginBottom: '2.5rem',
        }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem,5vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Rewards & Vouchers
          </h1>
          <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
        </div>

        {/* Empty state */}
        <div style={{
          background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
          padding: '3rem 2rem', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
        }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 400, color: '#FAFAF8', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
            No rewards yet
          </h2>
          <p className="font-sans" style={{ fontSize: '0.875rem', color: 'rgba(250,250,248,0.4)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto 1.75rem' }}>
            Complete visits and earn points to unlock exclusive rewards and vouchers.
          </p>
          <Link href="/booking" className="btn-gold" style={{ display: 'inline-flex' }}>Start Earning</Link>
        </div>

        {/* Notice */}
        <p style={{
          fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', fontStyle: 'italic',
          color: 'rgba(250,250,248,0.3)', textAlign: 'center', marginTop: '1.5rem',
          opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease 0.2s',
        }}>
          Vouchers issued by your stylist will appear here.
        </p>

      </div>
    </main>
  )
}
