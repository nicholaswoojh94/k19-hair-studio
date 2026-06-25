'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { getSupabaseBrowser } from '@/lib/supabase'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

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

function CompleteProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'

  const [userId, setUserId] = useState('')
  const [hasBirthday, setHasBirthday] = useState(false)

  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+60')
  const [bdMonth, setBdMonth] = useState('')
  const [bdDay, setBdDay] = useState('')
  const [bdYear, setBdYear] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [initialising, setInitialising] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserId(session.user.id)

      // Check if birthday is already set
      const { data: userData } = await supabase
        .from('users')
        .select('birthday')
        .eq('id', session.user.id)
        .single()

      if (userData?.birthday) setHasBirthday(true)
      setInitialising(false)
    }
    init()
  }, [router])

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i)

  function validate() {
    const errs: Record<string, string> = {}
    if (!phone.trim()) errs.phone = 'Phone number is required.'
    if (!hasBirthday && (!bdMonth || !bdDay || !bdYear)) errs.birthday = 'Please complete your birthday.'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const birthday = !hasBirthday && bdYear && bdMonth && bdDay
        ? `${bdYear}-${String(bdMonth).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
        : null

      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phone: `${countryCode}${phone}`,
          birthday,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrors({ phone: data.error || 'Failed to save. Please try again.' })
        return
      }

      const data = await res.json()

      // Update localStorage with complete profile
      try {
        const existing = JSON.parse(localStorage.getItem('k19_user') || '{}')
        localStorage.setItem('k19_user', JSON.stringify({
          ...existing,
          id: userId,
          phone: `${countryCode}${phone}`,
          name: data.user?.name || existing.name || '',
          email: data.user?.email || existing.email || '',
          birthday: data.user?.birthday || existing.birthday || '',
        }))
      } catch { /* ignore */ }

      router.push(redirectTo)
    } catch {
      setErrors({ phone: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (initialising) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(201,169,110,0.3)', borderTopColor: '#C9A96E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#242424', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '2.5rem 2rem',
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

        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', marginBottom: '0.5rem' }}>
          One last step
        </h1>
        <p className="font-sans" style={{ fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          {"We need your phone number to confirm bookings and send reminders."}
        </p>

        {/* Phone */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
            Phone Number<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
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
            <input
              type="tel" value={phone}
              onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
              onKeyDown={e => e.key === 'Enter' && !(!hasBirthday) && handleSubmit()}
              placeholder="11-2778 5730" maxLength={12}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${errors.phone ? '#E57373' : 'rgba(201,169,110,0.2)'}`,
                borderRadius: 4, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#FAFAF8',
                fontFamily: "'Poppins',sans-serif", outline: 'none', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.phone ? '#E57373' : 'rgba(201,169,110,0.2)')}
            />
          </div>
          {errors.phone && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.phone}</p>}
        </div>

        {/* Birthday — only if not already set */}
        {!hasBirthday && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="font-sans" style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem' }}>
              Birthday<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={bdMonth} onChange={e => { setBdMonth(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={selectStyle}>
                <option value="" disabled style={{ background: '#1C1C1C' }}>Month</option>
                {MONTHS_EN.map((m, i) => <option key={i} value={String(i + 1)} style={{ background: '#1C1C1C' }}>{m}</option>)}
              </select>
              <select value={bdDay} onChange={e => { setBdDay(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={{ ...selectStyle, maxWidth: 85 }}>
                <option value="" disabled style={{ background: '#1C1C1C' }}>Day</option>
                {days.map(d => <option key={d} value={String(d)} style={{ background: '#1C1C1C' }}>{d}</option>)}
              </select>
              <select value={bdYear} onChange={e => { setBdYear(e.target.value); setErrors(p => ({ ...p, birthday: '' })) }} style={{ ...selectStyle, maxWidth: 100 }}>
                <option value="" disabled style={{ background: '#1C1C1C' }}>Year</option>
                {years.map(y => <option key={y} value={String(y)} style={{ background: '#1C1C1C' }}>{y}</option>)}
              </select>
            </div>
            {errors.birthday && <p style={{ fontSize: '0.75rem', color: '#E57373', marginTop: 4, fontFamily: "'Poppins',sans-serif" }}>{errors.birthday}</p>}
            <p className="font-sans" style={{ fontSize: '0.72rem', color: '#C9A96E', marginTop: '0.5rem', opacity: 0.8 }}>
              {"Used for your birthday treat — we'll send you a special reward!"}
            </p>
          </div>
        )}

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
            <><Spinner size={16} color="#1C1C1C" /><span>Saving...</span></>
          ) : 'Complete Setup'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function CompleteProfilePage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>}><CompleteProfileContent /></Suspense>
}
