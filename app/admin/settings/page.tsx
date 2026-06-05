'use client'
export default function AdminSettings() {
  return (
    <div style={{ padding: '32px 40px', fontFamily: "'Poppins',sans-serif" }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 8px' }}>Settings</h1>
      <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '0.85rem', margin: '0 0 40px' }}>Configure booking rules, loyalty and notifications.</p>
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '64px', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>⚙️</p>
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>Coming Soon</p>
        <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>Settings will be available in the next update.</p>
      </div>
    </div>
  )
}
