'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Spinner } from '@/components/ui/spinner'
import { getSupabaseBrowser } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  async function handleSubmit() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 420,
    background: '#242424',
    border: '1px solid rgba(201,169,110,0.2)',
    borderRadius: 8,
    padding: '2.5rem 2rem',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/">
            <Image src="/brand_assets/K19_logo_white_transparent.png" alt="K19 Hair Studio"
              width={300} height={120} style={{ height: 120, width: 'auto', margin: '0 auto' }}/>
          </Link>
        </div>
        <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', marginBottom: '2rem' }}/>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.75rem' }}>
              Check your email
            </h2>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.5)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {"We sent a password reset link to "}<span style={{ color: '#C9A96E' }}>{email}</span>. The link expires in 1 hour.
            </p>
            <Link href="/login" style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem', color: '#C9A96E', textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
              Forgot password?
            </h1>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {"Enter your email and we'll send you a reset link."}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
                Email<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
              </label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@email.com"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,169,110,0.2)', borderRadius: 4,
                  padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#FAFAF8',
                  fontFamily: "'Poppins',sans-serif", outline: 'none',
                  transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
              />
              {error && <p style={{ fontSize: '0.78rem', color: '#E57373', marginTop: 6, fontFamily: "'Poppins',sans-serif" }}>{error}</p>}
            </div>

            <button
              className="btn-gold"
              style={{
                width: '100%', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><Spinner size={16} color="#1C1C1C" /><span>Sending...</span></>
              ) : 'Send Reset Link'}
            </button>

            <p className="font-sans" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)' }}>
              <Link href="/login" style={{ color: '#C9A96E', textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
