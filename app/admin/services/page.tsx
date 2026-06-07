'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'

type Service = {
  id: string
  name_en: string
  name_bm: string | null
  name_zh: string | null
  duration_minutes: number
  price_from: number | null
  price_to: number | null
  is_active: boolean
  sort_order: number
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

const emptyService = {
  name_en: '', name_bm: '', name_zh: '',
  duration_minutes: 60, price_from: '', price_to: '',
  sort_order: 99, is_active: true,
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<any>(emptyService)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      setServices(data.services || [])
    } finally {
      setLoading(false)
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id)
    setShowAddForm(false)
    setForm({
      name_en: s.name_en, name_bm: s.name_bm || '',
      name_zh: s.name_zh || '',
      duration_minutes: s.duration_minutes,
      price_from: s.price_from ?? '', price_to: s.price_to ?? '',
      sort_order: s.sort_order, is_active: s.is_active,
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_from: form.price_from !== '' ? parseFloat(form.price_from) : null,
          price_to: form.price_to !== '' ? parseFloat(form.price_to) : null,
          duration_minutes: parseInt(form.duration_minutes),
          is_active: form.is_active !== false,
        })
      })

      if (res.ok) {
        await fetchServices()
        setEditingId(null)
        setShowAddForm(false)
        setForm(emptyService)
        setToastMsg(editingId ? 'Service updated.' : 'Service added.')
        setShowToast(true)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/admin/services/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_en: s.name_en, name_bm: s.name_bm, name_zh: s.name_zh,
        duration_minutes: s.duration_minutes,
        price_from: s.price_from, price_to: s.price_to,
        sort_order: s.sort_order, is_active: !s.is_active,
      })
    })
    await fetchServices()
  }

  function ServiceForm() {
    return (
      <div style={{ background: '#F8F8F6', borderRadius: 10, padding: '24px', marginBottom: 16 }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 16px' }}>
          {editingId ? 'Edit Service' : 'Add New Service'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Name (English) *', key: 'name_en', placeholder: 'e.g. Haircut (Men)' },
            { label: 'Name (BM)', key: 'name_bm', placeholder: 'e.g. Gunting Rambut' },
            { label: 'Name (Chinese)', key: 'name_zh', placeholder: 'e.g. 男士剪发' },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input type="text" value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Duration (min) *', key: 'duration_minutes', placeholder: '60', type: 'number' },
            { label: 'Price From (RM)', key: 'price_from', placeholder: '80', type: 'number' },
            { label: 'Price To (RM)', key: 'price_to', placeholder: '150 (optional)', type: 'number' },
            { label: 'Sort Order', key: 'sort_order', placeholder: '1', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={handleSave} disabled={saving || !form.name_en}
            style={{
              padding: '9px 20px', background: form.name_en ? '#C9A96E' : 'rgba(201,169,110,0.3)',
              border: 'none', borderRadius: 6, color: '#1C1C1C',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: saving || !form.name_en ? 'not-allowed' : 'pointer',
              fontFamily: "'Poppins',sans-serif", display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {saving ? <><Spinner size={12} color="#1C1C1C" /> Saving...</> : editingId ? 'Save Changes' : 'Add Service'}
          </button>
          <button type="button"
            onClick={() => { setEditingId(null); setShowAddForm(false); setForm(emptyService) }}
            style={{
              padding: '9px 20px', background: 'transparent',
              border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, color: 'rgba(0,0,0,0.5)',
              fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
            }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'Poppins',sans-serif", minHeight: '100vh', background: '#F4F4F2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1C1C1C', margin: '0 0 4px' }}>Services</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>Manage your service menu, pricing and duration.</p>
        </div>
        {!showAddForm && !editingId && (
          <button type="button" onClick={() => { setShowAddForm(true); setEditingId(null); setForm(emptyService) }}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)',
              backgroundSize: '200% 100%', animation: 'shimmer2 2.6s infinite linear',
              border: '1.5px solid rgba(201,169,110,0.6)', borderRadius: 6,
              color: '#1C1C1C', fontSize: '0.78rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
            }}>
            + Add Service
          </button>
        )}
      </div>

      {(showAddForm || editingId) && <ServiceForm />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}><Spinner size={24} color="#C9A96E" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {services.map(s => (
            <div key={s.id} style={{
              background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10, padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: s.is_active ? 1 : 0.55,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>{s.name_en}</h3>
                  {!s.is_active && (
                    <span style={{ fontSize: '0.62rem', color: '#E57373', background: 'rgba(229,115,115,0.1)', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>
                      DISABLED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>⏱ {s.duration_minutes} min</p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                    💰 {s.price_from ? `RM ${s.price_from}${s.price_to ? ` – RM ${s.price_to}` : ''}` : 'No price set'}
                  </p>
                  {s.name_bm && <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.3)', margin: 0 }}>{s.name_bm}</p>}
                  {s.name_zh && <p style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.3)', margin: 0 }}>{s.name_zh}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button type="button" onClick={() => startEdit(s)}
                  style={{
                    padding: '7px 14px', background: 'transparent',
                    border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6,
                    color: '#1C1C1C', fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                  }}>
                  Edit
                </button>
                <button type="button" onClick={() => toggleActive(s)}
                  style={{
                    padding: '7px 14px', background: 'transparent',
                    border: `1.5px solid ${s.is_active ? '#E57373' : '#4CAF50'}`,
                    borderRadius: 6, color: s.is_active ? '#E57373' : '#4CAF50',
                    fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                  }}>
                  {s.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toastMsg} type="success" isVisible={showToast} onClose={() => setShowToast(false)} />
      <style>{`@keyframes shimmer2 { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}
