'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { getSupabaseBrowser } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — listen for the session
    const supabase = getSupabaseBrowser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if there is already a session (e.g. page reloaded after recovery)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    // If hash contains error, flag invalid link
    const hash = window.location.hash
    if (hash.includes('error=')) {
      setInvalidLink(true)
    }

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
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

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(201,169,110,0.2)', borderRadius: 4,
    padding: '0.75rem 1rem', paddingRight: '2.75rem',
    fontSize: '0.875rem', color: '#FAFAF8',
    fontFamily: "'Poppins',sans-serif", outline: 'none',
    transition: 'border-color 0.2s ease', boxSizing: 'border-box',
  }

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.35)', padding: 0 }}
      onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
      onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.35)')}>
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  )

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

        {invalidLink ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(229,115,115,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.75rem' }}>Link expired</h2>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.5)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password" className="btn-gold" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', textDecoration: 'none', fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem' }}>
              Request new link
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.75rem' }}>Password updated</h2>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.5)', lineHeight: 1.7 }}>
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
              Set new password
            </h1>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Choose a strong password for your account.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
                New Password<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="At least 8 characters" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
                Confirm Password<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  placeholder="Repeat your password" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
                />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
            </div>

            {error && <p style={{ fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', fontFamily: "'Poppins',sans-serif" }}>{error}</p>}

            {!sessionReady && !invalidLink && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)', marginBottom: '0.75rem', fontFamily: "'Poppins',sans-serif" }}>
                Waiting for link verification...
              </p>
            )}

            <button
              className="btn-gold"
              style={{
                width: '100%', opacity: (loading || !sessionReady) ? 0.6 : 1,
                cursor: (loading || !sessionReady) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onClick={handleReset}
              disabled={loading || !sessionReady}
            >
              {loading ? (
                <><Spinner size={16} color="#1C1C1C" /><span>Updating...</span></>
              ) : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
