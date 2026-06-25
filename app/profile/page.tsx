'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

import { User } from 'lucide-react'
import { Toast } from '@/components/ui/toast'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const COUNTRY_CODES = ['+60','+65','+61','+44','+62','+63','+66','+84','+86','+81','+82','+91','+1']

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function ProfilePage() {
  const [visible, setVisible] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+60')
  const [email, setEmail] = useState('')
  const [bdMonth, setBdMonth] = useState('')
  const [bdDay, setBdDay] = useState('')
  const [bdYear, setBdYear] = useState('')

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    try {
      const stored = localStorage.getItem('k19_user')
      if (stored) {
        const user = JSON.parse(stored)
        if (!user.phone) {
          window.location.href = '/auth/complete-profile?redirect=/profile'
          return
        }
        setName(user.name || '')
        setEmail(user.email || '')
        const rawPhone = user.phone || ''
        const matched = COUNTRY_CODES.find(c => rawPhone.startsWith(c))
        if (matched) { setCountryCode(matched); setPhone(rawPhone.slice(matched.length)) }
        else { setPhone(rawPhone) }
        if (user.birthday) {
          const parts = user.birthday.split('-')
          if (parts.length === 3) {
            setBdYear(parts[0])
            setBdMonth(String(parseInt(parts[1], 10)))
            setBdDay(String(parseInt(parts[2], 10)))
          }
        }
      }
    } catch { /* ignore */ }
  }, [])

  function handleSave() {
    try {
      const birthday = bdYear && bdMonth && bdDay
        ? `${bdYear}-${String(bdMonth).padStart(2,'0')}-${String(bdDay).padStart(2,'0')}`
        : ''
      localStorage.setItem('k19_user', JSON.stringify({ phone: `${countryCode}${phone}`, name, email, birthday }))
      localStorage.setItem('k19-user-name', name)
    } catch { /* ignore */ }
    setShowToast(true)
  }

  const initials = name ? getInitials(name) : '?'
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

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

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'Poppins',sans-serif", fontSize: '0.75rem',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'rgba(250,250,248,0.4)', marginBottom: '0.5rem',
  }

  return (
    <>
      <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', paddingTop: '200px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
            marginBottom: '2.5rem',
          }}>
            <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem,5vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              My Profile
            </h1>
            <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
          </div>

          {/* Avatar */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: '2rem',
            opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease 0.1s',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C9A96E, #A8833E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Poppins', sans-serif", fontSize: '1.4rem', fontWeight: 600, color: '#1C1C1C',
            }}>
              {name ? initials : <User size={28} color="#1C1C1C" strokeWidth={2} />}
            </div>
          </div>

          {/* Edit form */}
          <div style={{
            background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
            padding: '2rem', marginBottom: '1.5rem',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
          }}>
            {/* Full Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>
                Full Name<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="k-input" placeholder="Your full name"/>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>
                Phone Number<span style={{ color: '#C9A96E', marginLeft: 3 }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{ background: '#1C1C1C', border: '1px solid rgba(201,169,110,0.4)', borderRadius: 4, padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'rgba(250,250,248,0.75)', fontFamily: "'Poppins',sans-serif", outline: 'none', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s ease' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.8)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
                >
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
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="k-input" placeholder="11-2778 5730" maxLength={12} style={{ flex: 1 }}/>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="k-input" placeholder="you@email.com"/>
            </div>

            {/* Birthday */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={labelStyle}>Birthday</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={bdMonth} onChange={e => setBdMonth(e.target.value)} style={selectStyle}>
                  <option value="" disabled style={{ background: '#1C1C1C' }}>Month</option>
                  {MONTHS.map((m, i) => <option key={i} value={String(i + 1)} style={{ background: '#1C1C1C' }}>{m}</option>)}
                </select>
                <select value={bdDay} onChange={e => setBdDay(e.target.value)} style={{ ...selectStyle, maxWidth: 85 }}>
                  <option value="" disabled style={{ background: '#1C1C1C' }}>Day</option>
                  {days.map(d => <option key={d} value={String(d)} style={{ background: '#1C1C1C' }}>{d}</option>)}
                </select>
                <select value={bdYear} onChange={e => setBdYear(e.target.value)} style={{ ...selectStyle, maxWidth: 100 }}>
                  <option value="" disabled style={{ background: '#1C1C1C' }}>Year</option>
                  {years.map(y => <option key={y} value={String(y)} style={{ background: '#1C1C1C' }}>{y}</option>)}
                </select>
              </div>
            </div>

            <button className="btn-gold" style={{ width: '100%' }} onClick={handleSave}>Save Changes</button>
          </div>

        </div>
      </main>

      <Toast
        message="Profile updated successfully."
        type="success"
        duration={3000}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
