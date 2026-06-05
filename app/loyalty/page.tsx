'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

export default function LoyaltyPage() {
  const [points, setPoints] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const pts = localStorage.getItem('k19_loyalty')
      setPoints(pts ? parseInt(pts, 10) || 0 : 0)
    } catch { /* ignore */ }
    setTimeout(() => setVisible(true), 80)
  }, [])

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
            Loyalty Points
          </h1>
          <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
        </div>

        {/* Points balance card */}
        <div style={{
          background: '#242424', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8,
          padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '1.5rem',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
        }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(3rem,10vw,4.5rem)', fontWeight: 700, color: '#C9A96E', margin: 0, lineHeight: 1 }}>
            {points}
          </p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(250,250,248,0.4)', margin: '0.5rem 0 1rem' }}>
            points earned
          </p>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(201,169,110,0.6)', margin: 0 }}>
            Earn 1 point for every RM1 spent
          </p>
        </div>

        {/* How to earn */}
        <div style={{
          background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
          padding: '1.75rem 2rem', marginBottom: '1.5rem',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease 0.2s, transform 0.55s ease 0.2s',
        }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C9A96E', fontWeight: 500, marginBottom: '1.25rem', marginTop: 0 }}>
            How to earn points
          </p>
          {[
            { title: 'Every visit', desc: 'Earn points per RM spent on services' },
            { title: 'Birthday month', desc: 'Earn 2× points during your birthday month' },
            { title: 'Refer a friend', desc: 'Earn bonus points for every referral' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 2 ? '0.875rem' : 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A96E', flexShrink: 0, marginTop: 7 }}/>
              <div>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem', fontWeight: 500, color: '#FAFAF8', margin: 0 }}>{item.title}</p>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.4)', margin: '2px 0 0', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder notice */}
        <p style={{
          fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', fontStyle: 'italic',
          color: 'rgba(250,250,248,0.3)', textAlign: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease 0.3s',
          margin: 0,
        }}>
          Points redemption coming soon. Keep visiting to build your balance.
        </p>

      </div>
    </main>
  )
}
