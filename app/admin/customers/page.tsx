'use client'
import { useState, useEffect, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'

type Customer = {
  id: string
  name: string
  phone: string
  email: string
  birthday: string | null
  created_at: string
  is_active: boolean
}

type CustomerDetail = {
  customer: Customer
  bookings: any[]
  loyaltyPoints: any[]
  loyaltyBalance: number
}

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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 600, color: 'rgba(0,0,0,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editBirthday, setEditBirthday] = useState('')
  const [editActive, setEditActive] = useState(true)

  const [loyaltyPoints, setLoyaltyPoints] = useState('')
  const [loyaltyDesc, setLoyaltyDesc] = useState('')
  const [addingPoints, setAddingPoints] = useState(false)

  const [voucherType, setVoucherType] = useState('discount_rm')
  const [voucherValue, setVoucherValue] = useState('')
  const [voucherExpiry, setVoucherExpiry] = useState('')
  const [issuingVoucher, setIssuingVoucher] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers${search.length >= 2 ? `?q=${encodeURIComponent(search)}` : ''}`)
      const data = await res.json()
      setCustomers(data.customers || [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  async function fetchDetail(id: string) {
    setDetailLoading(true)
    setSelectedId(id)
    try {
      const res = await fetch(`/api/admin/customers/${id}`)
      const data = await res.json()
      setDetail(data)
      setEditName(data.customer.name || '')
      setEditEmail(data.customer.email || '')
      setEditBirthday(data.customer.birthday || '')
      setEditActive(data.customer.is_active)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSaveCustomer() {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, birthday: editBirthday || null, is_active: editActive })
      })
      if (res.ok) {
        await fetchCustomers()
        await fetchDetail(selectedId)
        setToastMsg('Customer updated successfully.')
        setShowToast(true)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleAddPoints() {
    if (!selectedId || !loyaltyPoints) return
    setAddingPoints(true)
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}/loyalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: parseInt(loyaltyPoints), description: loyaltyDesc || 'Manual adjustment by admin' })
      })
      if (res.ok) {
        await fetchDetail(selectedId)
        setLoyaltyPoints('')
        setLoyaltyDesc('')
        setToastMsg('Loyalty points updated.')
        setShowToast(true)
      }
    } finally {
      setAddingPoints(false)
    }
  }

  async function handleIssueVoucher() {
    if (!selectedId || !voucherValue) return
    setIssuingVoucher(true)
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voucherType, value: parseFloat(voucherValue), expiresAt: voucherExpiry || null })
      })
      if (res.ok) {
        await fetchDetail(selectedId)
        setVoucherValue('')
        setVoucherExpiry('')
        setToastMsg('Voucher issued successfully.')
        setShowToast(true)
      }
    } finally {
      setIssuingVoucher(false)
    }
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Poppins',sans-serif", overflow: 'hidden' }}>

      {/* Customer list */}
      <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.06)', background: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '28px 24px 16px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Customers</h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.35)', margin: '0 0 16px' }}>
            {customers.length} total
          </p>
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spinner size={20} color="#C9A96E" />
            </div>
          ) : customers.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(0,0,0,0.3)', fontSize: '0.82rem' }}>
              No customers found.
            </p>
          ) : customers.map(c => (
            <div
              key={c.id}
              onClick={() => fetchDetail(c.id)}
              style={{
                padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                cursor: 'pointer',
                background: selectedId === c.id ? 'rgba(201,169,110,0.06)' : 'transparent',
                borderLeft: selectedId === c.id ? '3px solid #C9A96E' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={e => { if (selectedId !== c.id) e.currentTarget.style.background = '#FAFAFA' }}
              onMouseOut={e => { if (selectedId !== c.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 3px' }}>
                    {c.name || 'No name'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>{c.phone}</p>
                </div>
                {!c.is_active && (
                  <span style={{ fontSize: '0.62rem', color: '#E57373', background: 'rgba(229,115,115,0.1)', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>
                    INACTIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer detail */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F4F2', padding: '32px 40px' }}>
        {!selectedId ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>👤</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 4px' }}>Select a customer</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>Click a customer on the left to view their profile.</p>
          </div>
        ) : detailLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spinner size={24} color="#C9A96E" />
          </div>
        ) : detail && (
          <div style={{ maxWidth: 700 }}>

            {/* Profile header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #C9A96E, #A8833E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 700, color: '#1C1C1C', flexShrink: 0,
              }}>
                {detail.customer.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>
                  {detail.customer.name || 'No name'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                  Member since {new Date(detail.customer.created_at).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
                  {' · '}{detail.bookings.length} booking{detail.bookings.length !== 1 ? 's' : ''}
                  {' · '}<span style={{ color: '#C9A96E', fontWeight: 600 }}>{detail.loyaltyBalance} pts</span>
                </p>
              </div>
            </div>

            {/* Edit details */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={sectionLabel}>Customer Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="text" value={detail.customer.phone} disabled
                    style={{ ...inputStyle, background: '#F0F0EE', color: 'rgba(0,0,0,0.4)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={labelStyle}>Birthday</label>
                  <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                  <span style={{ fontSize: '0.82rem', color: '#1C1C1C' }}>Account active</span>
                </label>
                <button type="button" onClick={handleSaveCustomer} disabled={saving}
                  style={{
                    padding: '9px 20px', background: '#C9A96E', border: 'none',
                    borderRadius: 6, color: '#1C1C1C', fontSize: '0.78rem', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif",
                    display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1,
                  }}>
                  {saving ? <><Spinner size={12} color="#1C1C1C" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Loyalty points */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={sectionLabel}>Loyalty Points</p>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C9A96E' }}>
                  {detail.loyaltyBalance} pts
                </span>
              </div>

              <div style={{ background: '#F8F8F6', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(0,0,0,0.45)', margin: '0 0 12px' }}>Manual Adjustment</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Points</label>
                    <input type="number" placeholder="e.g. 50 or -20" value={loyaltyPoints}
                      onChange={e => setLoyaltyPoints(e.target.value)} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input type="text" placeholder="Reason for adjustment" value={loyaltyDesc}
                      onChange={e => setLoyaltyDesc(e.target.value)} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                  </div>
                </div>
                <button type="button" onClick={handleAddPoints} disabled={addingPoints || !loyaltyPoints}
                  style={{
                    padding: '8px 16px', background: loyaltyPoints ? '#C9A96E' : 'rgba(201,169,110,0.3)',
                    border: 'none', borderRadius: 6, color: '#1C1C1C',
                    fontSize: '0.75rem', fontWeight: 600,
                    cursor: addingPoints || !loyaltyPoints ? 'not-allowed' : 'pointer',
                    fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  {addingPoints ? <><Spinner size={12} color="#1C1C1C" /> Adding...</> : 'Add Points'}
                </button>
              </div>

              {detail.loyaltyPoints.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.35)', margin: '0 0 8px' }}>Recent transactions</p>
                  {detail.loyaltyPoints.slice(0, 5).map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <p style={{ fontSize: '0.78rem', color: '#1C1C1C', margin: 0 }}>{p.description}</p>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: p.points > 0 ? '#4CAF50' : '#E57373', margin: 0 }}>
                        {p.points > 0 ? '+' : ''}{p.points} pts
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issue voucher */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={sectionLabel}>Issue Voucher</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={voucherType} onChange={e => setVoucherType(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="discount_rm">RM Discount</option>
                    <option value="discount_pct">% Discount</option>
                    <option value="free_service">Free Service</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Value</label>
                  <input type="number" placeholder={voucherType === 'discount_pct' ? '10 (%)' : '20 (RM)'}
                    value={voucherValue} onChange={e => setVoucherValue(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
                <div>
                  <label style={labelStyle}>Expires</label>
                  <input type="date" value={voucherExpiry} onChange={e => setVoucherExpiry(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
              </div>
              <button type="button" onClick={handleIssueVoucher} disabled={issuingVoucher || !voucherValue}
                style={{
                  padding: '9px 20px', background: voucherValue ? '#C9A96E' : 'rgba(201,169,110,0.3)',
                  border: 'none', borderRadius: 6, color: '#1C1C1C',
                  fontSize: '0.78rem', fontWeight: 600,
                  cursor: issuingVoucher || !voucherValue ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 8,
                }}>
                {issuingVoucher ? <><Spinner size={12} color="#1C1C1C" /> Issuing...</> : '🎟 Issue Voucher'}
              </button>
            </div>

            {/* Booking history */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={sectionLabel}>Booking History ({detail.bookings.length})</p>
              {detail.bookings.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.3)', margin: 0 }}>No bookings yet.</p>
              ) : detail.bookings.map((b: any) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 2px' }}>
                      {b.services?.name_en}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                      {formatDate(b.booking_date)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600, alignSelf: 'flex-start',
                    color: b.status === 'completed' ? '#2E7D32' : b.status === 'cancelled' ? '#C62828' : '#B8860B',
                    background: b.status === 'completed' ? '#F1F8F1' : b.status === 'cancelled' ? '#FFF5F5' : '#FFFBF0',
                    padding: '2px 8px', borderRadius: 3, textTransform: 'uppercase',
                  }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toast message={toastMsg} type="success" isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
