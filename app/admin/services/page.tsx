'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toast } from '@/components/ui/toast'
import { MenuButton } from '@/app/admin/menu-button'

type Service = {
  id: string
  name_en: string
  name_bm: string | null
  name_zh: string | null
  category: string
  duration_minutes: number
  buffer_minutes: number | null
  price_from: number | null
  price_to: number | null
  is_active: boolean
  sort_order: number
}

const CATEGORIES = ['All', 'Haircut', 'Wash', 'Chemical', 'Treatment']

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

const emptyForm = {
  name_en: '', name_bm: '', name_zh: '',
  category: 'Haircut', duration_minutes: 60,
  buffer_minutes: '', sort_order: 99,
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
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

  function openEdit(s: Service) {
    setEditingService(s)
    setShowAddPanel(false)
    setForm({
      name_en: s.name_en,
      name_bm: s.name_bm || '',
      name_zh: s.name_zh || '',
      category: s.category,
      duration_minutes: s.duration_minutes,
      buffer_minutes: s.buffer_minutes || '',
      sort_order: s.sort_order,
      is_active: s.is_active,
    })
  }

  function openAdd() {
    setEditingService(null)
    setShowAddPanel(true)
    setForm(emptyForm)
  }

  function closePanel() {
    setEditingService(null)
    setShowAddPanel(false)
    setForm(emptyForm)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services'
      const method = editingService ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration_minutes: parseInt(form.duration_minutes),
          buffer_minutes: form.buffer_minutes
            ? parseInt(form.buffer_minutes) : null,
          is_active: form.is_active !== false,
        })
      })

      if (res.ok) {
        await fetchServices()
        closePanel()
        setToastMsg(editingService ? 'Service updated.' : 'Service added.')
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
        ...s,
        is_active: !s.is_active,
        buffer_minutes: s.buffer_minutes,
        category: s.category,
      })
    })
    await fetchServices()
  }

  const filteredServices = categoryFilter === 'All'
    ? services
    : services.filter(s => s.category === categoryFilter)

  const isPanelOpen = !!editingService || showAddPanel

  const categoryColors: Record<string, string> = {
    Haircut: '#C9A96E',
    Wash: '#64B5F6',
    Chemical: '#CE93D8',
    Treatment: '#80CBC4',
  }

  // Side panel form
  const SidePanel = () => (
    <>
      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 100,
        }}
      />
      {/* Panel */}
      <div className="services-side-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 460,
        background: '#FFFFFF',
        zIndex: 101,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Poppins',sans-serif",
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 600,
            color: '#1C1C1C', margin: 0,
          }}>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button type="button" onClick={closePanel}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(0,0,0,0.4)',
              fontSize: '1.2rem', padding: 4,
            }}>
            ✕
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Category</label>
            <select
              value={form.category}
              onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Names */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name (English) *</label>
            <input type="text" value={form.name_en}
              onChange={e => setForm((p: any) => ({ ...p, name_en: e.target.value }))}
              style={inputStyle} placeholder="e.g. Haircut (Male)"
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name (Bahasa Malaysia)</label>
            <input type="text" value={form.name_bm}
              onChange={e => setForm((p: any) => ({ ...p, name_bm: e.target.value }))}
              style={inputStyle} placeholder="e.g. Gunting Rambut (Lelaki)"
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Name (Chinese)</label>
            <input type="text" value={form.name_zh}
              onChange={e => setForm((p: any) => ({ ...p, name_zh: e.target.value }))}
              style={inputStyle} placeholder="e.g. 男士剪发"
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
          </div>

          {/* Duration + Buffer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Duration (min) *</label>
              <input type="number" value={form.duration_minutes}
                onChange={e => setForm((p: any) => ({ ...p, duration_minutes: e.target.value }))}
                style={inputStyle} placeholder="60" min="5"
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
            <div>
              <label style={labelStyle}>Buffer Time (min)</label>
              <input type="number" value={form.buffer_minutes}
                onChange={e => setForm((p: any) => ({ ...p, buffer_minutes: e.target.value }))}
                style={inputStyle} placeholder="Override global"
                min="0" max="60"
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              <p style={{ fontSize: '0.68rem', color: 'rgba(0,0,0,0.35)', margin: '4px 0 0' }}>
                Leave blank to use global setting
              </p>
            </div>
          </div>

          {/* Sort order */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Sort Order</label>
            <input type="number" value={form.sort_order}
              onChange={e => setForm((p: any) => ({ ...p, sort_order: parseInt(e.target.value) }))}
              style={{ ...inputStyle, maxWidth: 120 }} placeholder="1"
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
          </div>

          {/* Active toggle */}
          {editingService && (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8F8F6', borderRadius: 8,
              padding: '14px 16px', marginBottom: 24,
            }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1C1C1C', margin: '0 0 2px' }}>
                  Service Active
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                  Inactive services won&apos;t appear in booking flow
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active !== false}
                  onChange={e => setForm((p: any) => ({ ...p, is_active: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: form.is_active !== false ? '#C9A96E' : 'rgba(0,0,0,0.15)',
                  borderRadius: 24, transition: 'background 0.2s ease',
                }} />
                <span style={{
                  position: 'absolute', top: 3,
                  left: form.is_active !== false ? 23 : 3,
                  width: 18, height: 18, background: '#FFFFFF', borderRadius: '50%',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </label>
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', gap: 12,
        }}>
          <button type="button" onClick={handleSave}
            disabled={saving || !form.name_en}
            style={{
              flex: 1, padding: '12px',
              background: form.name_en
                ? 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)'
                : 'rgba(201,169,110,0.3)',
              backgroundSize: '200% 100%',
              animation: form.name_en ? 'shimmer2 2.6s infinite linear' : 'none',
              border: '1.5px solid rgba(201,169,110,0.6)',
              borderRadius: 6, color: '#1C1C1C',
              fontSize: '0.82rem', fontWeight: 600,
              cursor: saving || !form.name_en ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              fontFamily: "'Poppins',sans-serif",
            }}>
            {saving
              ? <><Spinner size={14} color="#1C1C1C" /> Saving...</>
              : editingService ? 'Save Changes' : 'Add Service'}
          </button>
          <button type="button" onClick={closePanel}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: 6, color: 'rgba(0,0,0,0.5)',
              fontSize: '0.82rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
            }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="services-page" style={{
      padding: '32px 40px',
      fontFamily: "'Poppins',sans-serif",
      minHeight: '100vh',
      background: '#F4F4F2',
    }}>
      <style>{`
        @media (max-width: 1023px) {
          .services-page { padding: 20px 16px !important; }
          .services-side-panel { width: 100vw !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MenuButton />
          <div>
            <h1 style={{
              fontSize: '1.5rem', fontWeight: 600,
              color: '#1C1C1C', margin: '0 0 4px',
            }}>
              Services
            </h1>
            <p style={{
              fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0,
            }}>
              {services.length} services · {services.filter(s => s.is_active).length} active
            </p>
          </div>
        </div>
        <button type="button" onClick={openAdd}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer2 2.6s infinite linear',
            border: '1.5px solid rgba(201,169,110,0.6)',
            borderRadius: 6, color: '#1C1C1C',
            fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
          }}>
          + Add Service
        </button>
      </div>

      {/* Category filter dropdown */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '9px 36px 9px 14px',
            border: '1.5px solid rgba(0,0,0,0.12)',
            borderRadius: 6,
            fontSize: '0.82rem',
            fontFamily: "'Poppins',sans-serif",
            fontWeight: 500,
            color: '#1C1C1C',
            background: '#FFFFFF',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(0,0,0,0.4)' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            minWidth: 180,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c === 'All'
                ? `All Services (${services.length})`
                : `${c} (${services.filter(s => s.category === c).length})`}
            </option>
          ))}
        </select>
      </div>

      {/* Services list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spinner size={24} color="#C9A96E" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '48px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.88rem', color: 'rgba(0,0,0,0.35)', margin: 0 }}>
            No services in this category.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredServices.map(s => (
            <div key={s.id} style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 10,
              padding: '18px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: s.is_active ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}>
                  <h3 style={{
                    fontSize: '0.92rem', fontWeight: 600,
                    color: '#1C1C1C', margin: 0,
                  }}>
                    {s.name_en}
                  </h3>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 600,
                    color: categoryColors[s.category] || '#C9A96E',
                    background: `${categoryColors[s.category] || '#C9A96E'}18`,
                    padding: '2px 8px', borderRadius: 3,
                    letterSpacing: '0.04em',
                  }}>
                    {s.category}
                  </span>
                  {!s.is_active && (
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 600,
                      color: '#E57373',
                      background: 'rgba(229,115,115,0.1)',
                      padding: '2px 6px', borderRadius: 3,
                    }}>
                      DISABLED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'rgba(0,0,0,0.45)', margin: 0,
                  }}>
                    ⏱ {s.duration_minutes} min
                    {s.buffer_minutes
                      ? ` + ${s.buffer_minutes} min buffer`
                      : ' + global buffer'}
                  </p>
                  {(s.name_bm || s.name_zh) && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(0,0,0,0.3)', margin: 0,
                    }}>
                      {[s.name_bm, s.name_zh].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button type="button" onClick={() => openEdit(s)}
                  style={{
                    padding: '7px 16px',
                    background: 'transparent',
                    border: '1.5px solid rgba(0,0,0,0.12)',
                    borderRadius: 6, color: '#1C1C1C',
                    fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif",
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#C9A96E')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                >
                  Edit
                </button>
                <button type="button" onClick={() => toggleActive(s)}
                  style={{
                    padding: '7px 16px',
                    background: 'transparent',
                    border: `1.5px solid ${s.is_active ? '#E57373' : '#4CAF50'}`,
                    borderRadius: 6,
                    color: s.is_active ? '#E57373' : '#4CAF50',
                    fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif",
                    transition: 'all 0.2s ease',
                  }}>
                  {s.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side panel */}
      {isPanelOpen && <SidePanel />}

      <Toast
        message={toastMsg}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
