'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/context/LanguageContext'
import { Lang } from '@/lib/translations'

const DUMMY_OTP = '123456'
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_BM = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember']
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

function RegisterContent() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bdMonth, setBdMonth] = useState('')
  const [bdDay, setBdDay] = useState('')
  const [bdYear, setBdYear] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [attempts, setAttempts] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  function startResend() {
    setResendTimer(60)
    timerRef.current = setInterval(() => {
      setResendTimer(v => { if (v <= 1) { clearInterval(timerRef.current!); return 0 } return v - 1 })
    }, 1000)
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Full name is required.'
    if (!phone.trim()) errs.phone = 'Phone number is required.'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required.'
    if (!bdMonth || !bdDay || !bdYear) errs.birthday = 'Please complete your birthday.'
    return errs
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    try { localStorage.setItem('k19-user-name', name) } catch { /* ignore */ }
    setStep('otp')
    setOtp(['', '', '', '', '', ''])
    setAttempts(0)
    setOtpError('')
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
      try {
        const birthday = bdYear && bdMonth && bdDay ? `${bdYear}-${bdMonth.padStart(2,'0')}-${bdDay.padStart(2,'0')}` : ''
        localStorage.setItem('k19_user', JSON.stringify({ phone, name, email, birthday }))
        localStorage.setItem('k19-user-name', name)
      } catch { /* ignore */ }
      router.push(redirectTo)
    } else {
      const next = attempts + 1; setAttempts(next)
      if (next >= 3) {
        setOtpError(t('loginTooMany'))
        setTimeout(() => { setStep('form'); setOtpError(''); setAttempts(0) }, 2000)
      } else {
        setOtpError(t('loginWrongOtp'))
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    }
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

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 40px' }}>
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
              width={200} height={56} style={{ height: 56, width: 'auto', margin: '0 auto' }}/>
          </Link>
        </div>
        <div style={{ height: 1, background: 'rgba(201,169,110,0.1)', marginBottom: '2rem' }}/>

        {/* ── Form step ── */}
        {step === 'form' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.4rem' }}>{t('regTitle')}</h1>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.25rem' }}>{t('regSub')}</p>

            {/* ── Benefits banner ── */}
            <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 6, padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '0.75rem', fontWeight: 500 }}>
                Why join K19?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                    title: 'Loyalty Points',
                    copy: 'Earn points with every visit and redeem for discounts',
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
                    title: 'Birthday Treats',
                    copy: 'Enjoy a special reward during your birthday month',
                  },
                  {
                    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                    title: 'Easy Booking',
                    copy: 'Book, reschedule and manage appointments anytime',
                  },
                ].map(({ icon, title, copy }) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
                    <div>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem', fontWeight: 500, color: 'rgba(250,250,248,0.75)' }}>{title}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.7rem', color: 'rgba(250,250,248,0.35)', marginLeft: 6 }}>{copy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ── End benefits ── */}

            {/* Full Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>{t('regName')}</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }} className="k-input" placeholder="Your full name"/>
              {errors.name && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.name}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>{t('regPhone')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 4, padding: '0.75rem 0.875rem', fontSize: '0.9rem', color: 'rgba(250,250,248,0.5)', whiteSpace: 'nowrap' }}>+60</div>
                <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }} className="k-input" placeholder="11-2778 5730" maxLength={12} style={{ flex: 1 }}/>
              </div>
              {errors.phone && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.phone}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>{t('regEmail')}</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }} className="k-input" placeholder="you@email.com"/>
              {errors.email && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.email}</p>}
            </div>

            {/* Birthday */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>{t('regBirthday')}</label>
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

            <button className="btn-gold" style={{ width: '100%' }} onClick={handleSubmit}>{t('regCta')}</button>

            <p className="font-sans" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(250,250,248,0.35)' }}>
              {t('regHasAccount')}{' '}
              <Link href={`/login${redirectTo !== '/appointments' ? `?redirect=${redirectTo}` : ''}`} style={{ color: '#C9A96E', textDecoration: 'none' }}>{t('regLoginLink')}</Link>
            </p>
          </div>
        )}

        {/* ── OTP step ── */}
        {step === 'otp' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => { setStep('form'); setOtpError('') }} className="font-sans"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,250,248,0.5)', fontSize: '0.78rem', letterSpacing: '0.04em', marginBottom: '1.25rem', padding: 0, fontFamily: "'Poppins',sans-serif" }}
              onMouseOver={e => (e.currentTarget.style.color = '#C9A96E')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(250,250,248,0.5)')}>
              {t('loginBack')}
            </button>

            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>{t('loginCheckWa')}</h2>
            <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {t('loginOtpSub')} <span style={{ color: '#C9A96E' }}>+60 {phone}</span>
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.75rem' }}>
              {otp.map((v, i) => (
                <input key={i} ref={el => { otpRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={v}
                  onChange={e => handleOtpInput(e.target.value, i)}
                  onKeyDown={e => handleOtpKey(e, i)}
                  className="otp-box"/>
              ))}
            </div>

            {otpError && <p style={{ fontSize: '0.78rem', color: '#E57373', marginBottom: '0.75rem', textAlign: 'center', fontFamily: "'Poppins',sans-serif" }}>{otpError}</p>}

            <button className="btn-gold" style={{ width: '100%' }} onClick={handleVerify}>{t('loginVerify')}</button>

            <p className="font-sans" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'rgba(250,250,248,0.35)' }}>
              {t('loginResendPrefix')}{' '}
              {resendTimer > 0
                ? <span style={{ color: 'rgba(250,250,248,0.3)' }}>{t('loginResendIn')} 0:{String(resendTimer).padStart(2, '0')}</span>
                : <button onClick={startResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A96E', fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', padding: 0 }}>{t('loginResendLink')}</button>
              }
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>}><RegisterContent /></Suspense>
}
