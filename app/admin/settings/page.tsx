'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'
import { MenuButton } from '@/app/admin/menu-button'

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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const UI_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon–Sun display order

type BusinessHourRow = {
  day_of_week: number
  opening_time: string
  closing_time: string
  is_closed: boolean
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [businessHours, setBusinessHours] = useState<BusinessHourRow[]>([])
  const [savingHours, setSavingHours] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchBusinessHours()
  }, [])

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

  async function fetchBusinessHours() {
    try {
      const res = await fetch('/api/admin/business-hours')
      const data = await res.json()
      if (data.hours && data.hours.length === 7) {
        setBusinessHours(data.hours)
      } else {
        // Default seed if table not yet created
        setBusinessHours(UI_ORDER.map(d => ({
          day_of_week: d,
          opening_time: '11:00',
          closing_time: '20:00',
          is_closed: false,
        })))
      }
    } catch {
      // silently fail — table may not exist yet
    }
  }

  function updateHour(dayOfWeek: number, field: keyof BusinessHourRow, value: string | boolean) {
    setBusinessHours(prev => prev.map(row =>
      row.day_of_week === dayOfWeek ? { ...row, [field]: value } : row
    ))
  }

  async function saveBusinessHours() {
    setSavingHours(true)
    try {
      const res = await fetch('/api/admin/business-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: businessHours }),
      })
      if (res.ok) {
        setToastMsg('Business hours saved.')
        setToastType('success')
        setShowToast(true)
      } else {
        const data = await res.json()
        setToastMsg(data.error || 'Failed to save hours.')
        setToastType('error')
        setShowToast(true)
      }
    } finally {
      setSavingHours(false)
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
    <div className="settings-page" style={{ padding: '32px 40px', fontFamily: "'Poppins',sans-serif", minHeight: '100vh', background: '#F4F4F2' }}>
      <style>{`
        @media (max-width: 1023px) {
          .settings-page { padding: 20px 16px !important; }
          .settings-section { padding: 20px 16px !important; }
          .bh-header-row { display: none !important; }
          .bh-row { grid-template-columns: 76px minmax(0, 1fr) minmax(0, 1fr) 50px !important; gap: 6px !important; }
          .settings-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <MenuButton />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Settings</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>Configure booking rules, loyalty program and system preferences.</p>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* Booking settings */}
        <div className="settings-section" style={sectionStyle}>
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
          </div>
          <SaveButton keys={['buffer_minutes', 'booking_days_ahead']} />
        </div>

        {/* Business hours */}
        <div className="settings-section" style={sectionStyle}>
          <p style={sectionLabelStyle}>Business Hours</p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 20px' }}>
            Set opening and closing times per day. Toggle &quot;Closed&quot; to block all slots for that day.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {/* Header row */}
            <div className="bh-header-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px', gap: 12, alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Opens</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Closes</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Closed</span>
            </div>

            {UI_ORDER.map(dayIndex => {
              const row = businessHours.find(r => r.day_of_week === dayIndex)
              if (!row) return null
              return (
                <div key={dayIndex} className="bh-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: row.is_closed ? 400 : 500, color: row.is_closed ? 'rgba(0,0,0,0.3)' : '#1C1C1C' }}>
                    {DAY_NAMES[dayIndex]}
                  </span>
                  <input
                    type="time"
                    value={row.opening_time.slice(0, 5)}
                    onChange={e => updateHour(dayIndex, 'opening_time', e.target.value)}
                    disabled={row.is_closed}
                    style={{
                      ...inputStyle,
                      color: '#1C1C1C',
                      colorScheme: 'light',
                      backgroundColor: row.is_closed ? '#F0F0EE' : '#FAFAFA',
                      opacity: row.is_closed ? 0.4 : 1,
                      cursor: row.is_closed ? 'not-allowed' : 'auto',
                      padding: '8px 10px',
                    }}
                    onFocus={e => { if (!row.is_closed) e.currentTarget.style.borderColor = '#C9A96E' }}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  />
                  <input
                    type="time"
                    value={row.closing_time.slice(0, 5)}
                    onChange={e => updateHour(dayIndex, 'closing_time', e.target.value)}
                    disabled={row.is_closed}
                    style={{
                      ...inputStyle,
                      color: '#1C1C1C',
                      colorScheme: 'light',
                      backgroundColor: row.is_closed ? '#F0F0EE' : '#FAFAFA',
                      opacity: row.is_closed ? 0.4 : 1,
                      cursor: row.is_closed ? 'not-allowed' : 'auto',
                      padding: '8px 10px',
                    }}
                    onFocus={e => { if (!row.is_closed) e.currentTarget.style.borderColor = '#C9A96E' }}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  />
                  <div
                    onClick={() => updateHour(dayIndex, 'is_closed', !row.is_closed)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: row.is_closed ? '#E57373' : 'rgba(0,0,0,0.12)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF',
                      position: 'absolute', top: 3, transition: 'left 0.2s ease',
                      left: row.is_closed ? 23 : 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          <button type="button" onClick={saveBusinessHours} disabled={savingHours}
            style={{
              padding: '9px 20px', background: '#C9A96E', border: 'none',
              borderRadius: 6, color: '#1C1C1C', fontSize: '0.78rem', fontWeight: 600,
              cursor: savingHours ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
              display: 'flex', alignItems: 'center', gap: 8, opacity: savingHours ? 0.7 : 1,
            }}>
            {savingHours ? <><Spinner size={12} color="#1C1C1C" /> Saving...</> : 'Save Hours'}
          </button>
        </div>

        {/* Loyalty settings */}
        <div className="settings-section" style={sectionStyle}>
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
        <div className="settings-section" style={sectionStyle}>
          <p style={sectionLabelStyle}>OTP & Notifications</p>

          {/* Toggle 1 — Test mode */}
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

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 20px' }} />

          {/* Toggle 2 — Live sending */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>WhatsApp Live Sending</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                When enabled, real OTP messages are sent via Meta&apos;s WhatsApp Cloud API.
                Has no effect while Test Mode is ON.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0, marginLeft: 24 }}>
              <div
                onClick={() => updateSetting('whatsapp_sending_enabled', settings.whatsapp_sending_enabled === 'true' ? 'false' : 'true')}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: settings.whatsapp_sending_enabled === 'true' ? '#C9A96E' : 'rgba(0,0,0,0.15)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF',
                  position: 'absolute', top: 3, transition: 'left 0.2s ease',
                  left: settings.whatsapp_sending_enabled === 'true' ? 23 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: '#1C1C1C', fontWeight: settings.whatsapp_sending_enabled === 'true' ? 600 : 400 }}>
                {settings.whatsapp_sending_enabled === 'true' ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>

          <SaveButton keys={['whatsapp_otp_test_mode', 'whatsapp_sending_enabled']} />
        </div>

        {/* Change password */}
        <div className="settings-section" style={sectionStyle}>
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
