'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'

const DUMMY_OTP = '123456'

export default function LoginPage() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animate in
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  // Close lang menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as Element).closest('#langSwitcher')) setLangOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  function startResend() {
    setResendTimer(60)
    timerRef.current = setInterval(() => {
      setResendTimer(v => { if (v <= 1) { clearInterval(timerRef.current!); return 0 } return v - 1 })
    }, 1000)
  }

  function handleSendOtp() {
    if (!phone.trim()) { setError('Please enter your phone number.'); return }
    setError('')
    setStep(2)
    setOtp(['', '', '', '', '', ''])
    setAttempts(0)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
    startResend()
  }

  function handleOtpInput(val: string, idx: number) {
    val = val.replace(/\D/, '')
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  function handleOtpKey(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  function handleVerify() {
    const code = otp.join('')
    if (code === DUMMY_OTP) {
      router.push('/appointments')
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 3) {
        setError(t('loginTooMany'))
        setTimeout(() => { setStep(1); setError(''); setAttempts(0) }, 2000)
      } else {
        setError(t('loginWrongOtp'))
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    }
  }

  const langLabel = lang === 'en' ? 'EN' : lang === 'bm' ? 'BM' : '中文'

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 40px' }}>
      {/* Lang switcher top-right */}
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
              width={200} height={56} style={{ height: 56, width: 'auto', margin: '0 auto' }}/>
          </Link>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', marginBottom: '2rem' }}/>

        {/* ── Step 1: Phone ── */}
        <div style={{ display: step === 1 ? 'block' : 'none', animation: step === 1 ? 'fadeIn 0.3s ease' : 'none' }}>
          <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
            {t('loginWelcome')}
          </h1>
          <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {t('loginSub')}
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 4, padding: '0.75rem 0.875rem', fontSize: '0.9rem', color: 'rgba(250,250,248,0.5)', whiteSpace: 'nowrap' }}>+60</div>
            <input
              type="tel" value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              placeholder="11-2778 5730"
              maxLength={12}
              className="k-input"
              style={{ flex: 1 }}
            />
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', fontFamily: "'Poppins',sans-serif" }}>{error}</p>}

          <button className="btn-gold" style={{ width: '100%' }} onClick={handleSendOtp}>{t('loginSendOtp')}</button>

          <p className="font-sans" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)' }}>
            {t('loginNoAccount')}{' '}
            <Link href="/register" style={{ color: '#C9A96E', textDecoration: 'none' }}>{t('loginRegisterLink')}</Link>
          </p>
        </div>

        {/* ── Step 2: OTP ── */}
        <div style={{ display: step === 2 ? 'block' : 'none', animation: step === 2 ? 'fadeIn 0.3s ease' : 'none' }}>
          <button onClick={() => { setStep(1); setError('') }} className="font-sans"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.5)', fontSize: '0.78rem', letterSpacing: '0.04em', marginBottom: '1.25rem', padding: 0, fontFamily: "'Poppins',sans-serif" }}
            onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.5)')}>
            {t('loginBack')}
          </button>

          <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
            {t('loginCheckWa')}
          </h2>
          <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {t('loginOtpSub')} <span style={{ color: '#C9A96E' }}>+60 {phone}</span>
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.75rem' }}>
            {otp.map((v, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1} value={v}
                onChange={e => handleOtpInput(e.target.value, i)}
                onKeyDown={e => handleOtpKey(e, i)}
                className="otp-box"
              />
            ))}
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', textAlign: 'center', fontFamily: "'Poppins',sans-serif" }}>{error}</p>}

          <button className="btn-gold" style={{ width: '100%' }} onClick={handleVerify}>{t('loginVerify')}</button>

          <p className="font-sans" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)' }}>
            {t('loginResendPrefix')}{' '}
            {resendTimer > 0
              ? <span style={{ color: 'rgba(250,250,248,0.3)' }}>{t('loginResendIn')} 0:{String(resendTimer).padStart(2,'0')}</span>
              : <button onClick={startResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A96E', fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', padding: 0 }}>{t('loginResendLink')}</button>
            }
          </p>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
