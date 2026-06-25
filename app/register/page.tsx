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

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_BM = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember']
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

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

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,169,110,0.2)',
  borderRadius: 4, padding: '0.7rem 0.75rem', color: '#FAFAF8',
  fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', outline: 'none',
  cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(201,169,110,0.5)' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  paddingRight: '2rem', flex: 1, minWidth: 0,
  transition: 'border-color 0.2s ease',
}

function RegisterContent() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+60')
  const [bdMonth, setBdMonth] = useState('')
  const [bdDay, setBdDay] = useState('')
  const [bdYear, setBdYear] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as Element).closest('#langSwitcher')) setLangOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const months = lang === 'bm' ? MONTHS_BM : lang === 'zh' ? MONTHS_ZH : MONTHS_EN
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i)
  const langLabel = lang === 'en' ? 'EN' : lang === 'bm' ? 'BM' : '中文'

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Full name is required.'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required.'
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    if (!phone.trim()) errs.phone = 'Phone number is required.'
    if (!bdMonth || !bdDay || !bdYear) errs.birthday = 'Please complete your birthday.'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseBrowser()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (!data.user) {
        setError('Something went wrong. Please try again.')
        return
      }

      const birthday = bdYear && bdMonth && bdDay
        ? `${bdYear}-${String(bdMonth).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
        : null

      const fullPhone = phone ? `${countryCode}${phone}` : null

      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, name, phone: fullPhone, email, birthday }),
      })

      // If session exists (email confirmation disabled), sign in immediately
      if (data.session) {
        try {
          localStorage.setItem('k19_user', JSON.stringify({
            id: data.user.id,
            phone: fullPhone || '',
            name,
            email,
            birthday: birthday || '',
          }))
        } catch { /* ignore */ }
        router.push(redirectTo)
      } else {
        // Email confirmation required
        setEmailSent(true)
      }

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

  // Email confirmation sent screen
  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#242424', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.75rem' }}>Check your email</h2>
          <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.5)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {"We sent a confirmation link to "}<span style={{ color: '#C9A96E' }}>{email}</span>. Click the link to activate your account.
          </p>
          <Link href="/login" style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem', color: '#C9A96E', textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

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
        width: '100%', maxWidth: 420, background: '#242424',
        border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '2.5rem 2rem',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/">
            <Image src="/brand_assets/K19_logo_white_transparent.png" alt="K19 Hair Studio"
              width={300} height={120} style={{ height: 120, width: 'auto', margin: '0 auto' }}/>
          </Link>
        </div>
        <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', marginBottom: '2rem' }}/>

        <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.4rem' }}>
          {t('regTitle')}
        </h1>
        <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.25rem' }}>
          {t('regSub')}
        </p>

        {/* Benefits banner */}
        <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 6, padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '0.75rem', fontWeight: 500 }}>
            Why join K19?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                title: 'Loyalty Points',
                copy: 'Earn points with every visit and redeem for discounts',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
                title: 'Birthday Treats',
                copy: 'Enjoy a special reward during your birthday month',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                title: 'Easy Booking',
                copy: 'Book, reschedule and manage appointments anytime',
              },
            ].map(({ icon, title, copy }) => (
              <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {icon}
                <div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.875rem', fontWeight: 600, color: '#FAFAF8', margin: 0 }}>{title}</p>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(250,250,248,0.5)', margin: 0, marginTop: 2, lineHeight: 1.5 }}>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          Sign up with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,169,110,0.12)' }}/>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', color: 'rgba(250,250,248,0.25)', letterSpacing: '0.06em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,169,110,0.12)' }}/>
        </div>

        {/* Full Name */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            {t('regName')}<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <input type="text" value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
            placeholder="Your full name" style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
            onBlur={e => (e.currentTarget.style.borderColor = errors.name ? '#E57373' : 'rgba(201,169,110,0.2)')}
          />
          {errors.name && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            {t('regEmail')}<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <input type="email" value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setError('') }}
            placeholder="you@email.com" style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
            onBlur={e => (e.currentTarget.style.borderColor = errors.email ? '#E57373' : 'rgba(201,169,110,0.2)')}
          />
          {errors.email && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            Password<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '', confirmPassword: '' })) }}
              placeholder="At least 8 characters"
              style={{ ...inputStyle, paddingRight: '2.75rem' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.password ? '#E57373' : 'rgba(201,169,110,0.2)')}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.35)', padding: 0 }}
              onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.35)')}>
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {errors.password && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            Confirm Password<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })) }}
              placeholder="Repeat your password"
              style={{ ...inputStyle, paddingRight: '2.75rem' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.confirmPassword ? '#E57373' : 'rgba(201,169,110,0.2)')}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.35)', padding: 0 }}
              onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.35)')}>
              {showConfirm ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.confirmPassword}</p>}
        </div>

        {/* Phone (optional) */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            {t('regPhone')}<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              style={{ background: '#1C1C1C', border: '1px solid rgba(201,169,110,0.4)', borderRadius: 4, padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'rgba(250,250,248,0.75)', fontFamily: "'Poppins',sans-serif", outline: 'none', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s ease' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.8)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}>
              <option value="+60">🇲🇾 +60</option>
              <option value="+65">🇸🇬 +65</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+62">🇮🇩 +62</option>
              <option value="+63">🇵🇭 +63</option>
              <option value="+66">🇹🇭 +66</option>
              <option value="+84">🇻🇳 +84</option>
              <option value="+86">🇨🇳 +86</option>
              <option value="+81">🇯🇵 +81</option>
              <option value="+82">🇰🇷 +82</option>
              <option value="+91">🇮🇳 +91</option>
            </select>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
              placeholder="11-2778 5730" maxLength={12}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.phone ? '#E57373' : 'rgba(201,169,110,0.2)')}
            />
          </div>
          {errors.phone && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.phone}</p>}
        </div>

        {/* Birthday */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            {t('regBirthday')}<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={bdMonth} onChange={e => { setBdMonth(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={selectStyle}>
              <option value="" disabled style={{ background: '#1C1C1C' }}>{t('regMonthPh')}</option>
              {months.map((m, i) => <option key={i} value={String(i + 1)} style={{ background: '#1C1C1C' }}>{m}</option>)}
            </select>
            <select value={bdDay} onChange={e => { setBdDay(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={{ ...selectStyle, maxWidth: 85 }}>
              <option value="" disabled style={{ background: '#1C1C1C' }}>{t('regDayPh')}</option>
              {days.map(d => <option key={d} value={String(d)} style={{ background: '#1C1C1C' }}>{d}</option>)}
            </select>
            <select value={bdYear} onChange={e => { setBdYear(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={{ ...selectStyle, maxWidth: 100 }}>
              <option value="" disabled style={{ background: '#1C1C1C' }}>{t('regYearPh')}</option>
              {years.map(y => <option key={y} value={String(y)} style={{ background: '#1C1C1C' }}>{y}</option>)}
            </select>
          </div>
          {errors.birthday && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.birthday}</p>}
          <p className="font-sans" style={{ fontSize: '0.72rem', color: '#C9A96E', marginTop: '0.5rem', opacity: 0.8 }}>{t('regBirthdayNote')}</p>
        </div>

        {error && <p style={{ color: '#E57373', fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}

        <button
          className="btn-gold"
          style={{
            width: '100%', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onClick={handleSubmit}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <><Spinner size={16} color="#1C1C1C" /><span>Creating account...</span></>
          ) : 'Create Account'}
        </button>

        <p className="font-sans" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)' }}>
          {t('regHasAccount')}{' '}
          <Link href={`/login${redirectTo !== '/appointments' ? `?redirect=${redirectTo}` : ''}`} style={{ color: '#C9A96E', textDecoration: 'none' }}>
            {t('regLoginLink')}
          </Link>
        </p>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>}><RegisterContent /></Suspense>
}
