'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'
import { Spinner } from '@/components/ui/spinner'
import { getSupabaseBrowser } from '@/lib/supabase'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(201,169,110,0.2)',
  borderRadius: 4,
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#FAFAF8',
  fontFamily: "'Poppins',sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
}

function LoginContent() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as Element).closest('#langSwitcher')) setLangOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  async function handleSignIn() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : authError.message)
        return
      }
      // Fetch extra user fields from users table
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, phone, email, birthday')
        .eq('id', data.user.id)
        .single()
      try {
        localStorage.setItem('k19_user', JSON.stringify({
          id: data.user.id,
          phone: userData?.phone || '',
          name: userData?.name || data.user.user_metadata?.full_name || '',
          email: data.user.email || '',
          birthday: userData?.birthday || '',
        }))
      } catch { /* ignore */ }
      router.push(redirectTo)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (authError) setError(authError.message)
    } catch {
      setError('Something went wrong. Please try again.')
      setGoogleLoading(false)
    }
  }

  const langLabel = lang === 'en' ? 'EN' : lang === 'bm' ? 'BM' : '中文'

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', overflowX: 'hidden' }}>
      {/* Lang switcher */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 200 }} id="langSwitcher">
        <button onClick={() => setLangOpen(v => !v)} className="nav-link flex items-center gap-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span>{langLabel}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        {langOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#1C1C1C', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 4, minWidth: 120, padding: '6px 0', zIndex: 200 }}>
            {(['en', 'bm', 'zh'] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setLangOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.7)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}
                onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.7)')}>
                {l === 'en' ? 'English' : l === 'bm' ? 'Bahasa Malaysia' : '中文'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#242424',
        border: '1px solid rgba(201,169,110,0.2)',
        borderRadius: 8,
        padding: '2.5rem 2rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/">
            <Image src="/brand_assets/K19_logo_white_transparent.png" alt="K19 Hair Studio"
              width={300} height={120} style={{ height: 120, width: 'auto', margin: '0 auto' }}/>
          </Link>
        </div>
        <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', marginBottom: '2rem' }}/>

        <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
          Welcome back
        </h1>
        <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Sign in to manage your appointments
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: 4, padding: '0.72rem 1rem', cursor: 'pointer',
            fontFamily: "'Poppins',sans-serif", fontSize: '0.875rem', color: '#FAFAF8',
            marginBottom: '1.25rem', transition: 'border-color 0.2s ease, background 0.2s ease',
            opacity: (googleLoading || loading) ? 0.6 : 1,
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        >
          {googleLoading ? <Spinner size={16} color="#FAFAF8" /> : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,169,110,0.12)' }}/>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.25)', letterSpacing: '0.06em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,169,110,0.12)' }}/>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            Email<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSignIn()}
            placeholder="you@email.com"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '0.5rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            Password<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: '2.75rem' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.35)', padding: 0 }}
              onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.35)')}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
          <Link href="/forgot-password" style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem', color: 'rgba(250,250,248,0.35)', textDecoration: 'none' }}
            onMouseOver={e => ((e.target as HTMLElement).style.color = '#C9A96E')}
            onMouseOut={e => ((e.target as HTMLElement).style.color = 'rgba(250,250,248,0.35)')}>
            Forgot password?
          </Link>
        </div>

        {error && <p style={{ fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', fontFamily: "'Poppins',sans-serif" }}>{error}</p>}

        <button
          className="btn-gold"
          style={{
            width: '100%', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onClick={handleSignIn}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <><Spinner size={16} color="#1C1C1C" /><span>Signing in...</span></>
          ) : 'Sign In'}
        </button>

        <p className="font-sans" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)' }}>
          {"Don't have an account? "}
          <Link href={`/register${redirectTo !== '/appointments' ? `?redirect=${redirectTo}` : ''}`} style={{ color: '#C9A96E', textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>}><LoginContent /></Suspense>
}
