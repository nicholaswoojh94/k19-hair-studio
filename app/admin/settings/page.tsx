'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
  fontSize: '0.85rem', fontFamily: "'Poppins',sans-serif",
  outline: 'none', background: '#FAFAFA', color: '#1C1C1C',
  boxSizing: 'border-box', transition: 'border-color 0.2s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 600,
  color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase',
  letterSpacing: '0.07em', marginBottom: 6,
}

const sectionStyle: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 10, padding: '28px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px',
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data.settings || {})
    } finally {
      setLoading(false)
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function saveSettings(keys: string[]) {
    setSaving(true)
    try {
      const updates = keys.map(key => ({ key, value: settings[key] || '' }))
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      if (res.ok) {
        setToastMsg('Settings saved successfully.')
        setToastType('success')
        setShowToast(true)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) return
    if (newPw !== confirmPw) {
      setToastMsg('New passwords do not match.')
      setToastType('error')
      setShowToast(true)
      return
    }
    if (newPw.length < 8) {
      setToastMsg('Password must be at least 8 characters.')
      setToastType('error')
      setShowToast(true)
      return
    }
    setChangingPw(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      })
      const data = await res.json()
      if (res.ok) {
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        setToastMsg('Password changed successfully.')
        setToastType('success')
      } else {
        setToastMsg(data.error || 'Failed to change password.')
        setToastType('error')
      }
      setShowToast(true)
    } finally {
      setChangingPw(false)
    }
  }

  const SaveButton = ({ keys }: { keys: string[] }) => (
    <button type="button" onClick={() => saveSettings(keys)} disabled={saving}
      style={{
        padding: '9px 20px', background: '#C9A96E', border: 'none',
        borderRadius: 6, color: '#1C1C1C', fontSize: '0.78rem', fontWeight: 600,
        cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
        display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1,
      }}>
      {saving ? <><Spinner size={12} color="#1C1C1C" /> Saving...</> : 'Save'}
    </button>
  )

  if (loading) {
    return (
      <div style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spinner size={24} color="#C9A96E" />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'Poppins',sans-serif", minHeight: '100vh', background: '#F4F4F2' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>Configure booking rules, loyalty program and system preferences.</p>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* Booking settings */}
        <div style={sectionStyle}>
          <p style={sectionLabelStyle}>Booking Settings</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Buffer Between Bookings (minutes)</label>
              <input type="number" value={settings.buffer_minutes || '15'}
                onChange={e => updateSetting('buffer_minutes', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', margin: '6px 0 0' }}>
                Added after each appointment before the next slot opens.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Days Ahead Customers Can Book</label>
              <input type="number" value={settings.booking_days_ahead || '30'}
                onChange={e => updateSetting('booking_days_ahead', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', margin: '6px 0 0' }}>
                How far in advance customers can make a booking.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Opening Time</label>
              <input type="time" value={settings.booking_start_time || '11:00'}
                onChange={e => updateSetting('booking_start_time', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
            <div>
              <label style={labelStyle}>Closing Time</label>
              <input type="time" value={settings.booking_end_time || '20:00'}
                onChange={e => updateSetting('booking_end_time', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
          </div>
          <SaveButton keys={['buffer_minutes', 'booking_days_ahead', 'booking_start_time', 'booking_end_time']} />
        </div>

        {/* Loyalty settings */}
        <div style={sectionStyle}>
          <p style={sectionLabelStyle}>Loyalty Program</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Points Earned per RM Spent</label>
              <input type="number" value={settings.loyalty_points_per_rm || '1'}
                onChange={e => updateSetting('loyalty_points_per_rm', e.target.value)}
                style={inputStyle} step="0.1"
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', margin: '6px 0 0' }}>
                e.g. 1 = 1 point per RM1 spent.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Points Needed to Redeem RM1</label>
              <input type="number" value={settings.loyalty_redeem_rate || '100'}
                onChange={e => updateSetting('loyalty_redeem_rate', e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', margin: '6px 0 0' }}>
                e.g. 100 = 100 points = RM1.
              </p>
            </div>
          </div>
          <SaveButton keys={['loyalty_points_per_rm', 'loyalty_redeem_rate']} />
        </div>

        {/* OTP / Test mode */}
        <div style={sectionStyle}>
          <p style={sectionLabelStyle}>OTP & Notifications</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>WhatsApp OTP Test Mode</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                When enabled, OTP is always <strong>123456</strong> — no WhatsApp message sent.
                Disable in production.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0, marginLeft: 24 }}>
              <div
                onClick={() => updateSetting('whatsapp_otp_test_mode', settings.whatsapp_otp_test_mode === 'true' ? 'false' : 'true')}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: settings.whatsapp_otp_test_mode === 'true' ? '#C9A96E' : 'rgba(0,0,0,0.15)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF',
                  position: 'absolute', top: 3, transition: 'left 0.2s ease',
                  left: settings.whatsapp_otp_test_mode === 'true' ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: '#1C1C1C', fontWeight: settings.whatsapp_otp_test_mode === 'true' ? 600 : 400 }}>
                {settings.whatsapp_otp_test_mode === 'true' ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
          <SaveButton keys={['whatsapp_otp_test_mode']} />
        </div>

        {/* Change password */}
        <div style={sectionStyle}>
          <p style={sectionLabelStyle}>Change Password</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters" autoComplete="new-password" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password" autoComplete="new-password" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            </div>
          </div>
          <button type="button" onClick={handleChangePassword}
            disabled={changingPw || !currentPw || !newPw || !confirmPw}
            style={{
              padding: '9px 20px',
              background: currentPw && newPw && confirmPw ? '#1C1C1C' : 'rgba(0,0,0,0.15)',
              border: 'none', borderRadius: 6, color: '#FFFFFF',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: changingPw || !currentPw || !newPw || !confirmPw ? 'not-allowed' : 'pointer',
              fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 8,
              opacity: changingPw ? 0.7 : 1,
            }}>
            {changingPw ? <><Spinner size={12} color="#FFFFFF" /> Changing...</> : 'Change Password'}
          </button>
        </div>

      </div>

      <Toast message={toastMsg} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
