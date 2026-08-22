'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/session'

type Voucher = {
  id: string
  code: string
  type: 'discount_rm' | 'discount_pct' | 'free_service'
  value: number
  is_used: boolean
  used_at: string | null
  expires_at: string | null
  created_at: string
  service_id: string | null
  services: { id: string; name_en: string } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function voucherLabel(v: Voucher): string {
  if (v.type === 'discount_rm')  return `RM ${Number(v.value).toFixed(0)} off`
  if (v.type === 'discount_pct') return `${Number(v.value).toFixed(0)}% off`
  return v.services?.name_en ?? 'Free service'
}

function voucherTypeName(v: Voucher): string {
  if (v.type === 'discount_rm')  return 'RM Discount'
  if (v.type === 'discount_pct') return '% Discount'
  return 'Free Service'
}

const GiftIcon = ({ muted }: { muted?: boolean }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A96E"
    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ opacity: muted ? 0.5 : 0.7 }}>
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Poppins',sans-serif",
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'rgba(250,250,248,0.3)',
      margin: '0 0 12px',
    }}>
      {children}
    </p>
  )
}

function VoucherCard({ v, dimmed }: { v: Voucher; dimmed?: boolean }) {
  const expired = !v.is_used && v.expires_at && new Date(v.expires_at) <= new Date()

  const badgeColor = v.is_used || expired
    ? 'rgba(250,250,248,0.25)'
    : '#C9A96E'
  const badgeBg = v.is_used || expired
    ? 'rgba(250,250,248,0.05)'
    : 'rgba(201,169,110,0.1)'
  const badgeBorder = v.is_used || expired
    ? 'rgba(250,250,248,0.08)'
    : 'rgba(201,169,110,0.2)'

  return (
    <div style={{
      background: dimmed ? '#1E1E1E' : '#242424',
      border: `1px solid ${dimmed ? 'rgba(250,250,248,0.06)' : 'rgba(201,169,110,0.15)'}`,
      borderRadius: 8,
      padding: '20px 24px',
      opacity: dimmed ? 0.65 : 1,
      transition: 'opacity 0.2s ease',
    }}>
      {/* Top row: type badge + value label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'inline-block',
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.62rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: badgeColor,
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            borderRadius: 3,
            padding: '2px 7px',
            marginBottom: 8,
          }}>
            {voucherTypeName(v)}
          </span>
          <p style={{
            fontFamily: "'Lora',serif",
            fontSize: '1.15rem',
            fontStyle: 'italic',
            color: dimmed ? 'rgba(250,250,248,0.5)' : '#FAFAF8',
            margin: 0,
            lineHeight: 1.25,
          }}>
            {voucherLabel(v)}
          </p>
        </div>
      </div>

      {/* Code */}
      <div style={{
        display: 'inline-block',
        background: 'rgba(201,169,110,0.06)',
        border: '1px solid rgba(201,169,110,0.12)',
        borderRadius: 4,
        padding: '5px 12px',
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "'Poppins',sans-serif",
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: dimmed ? 'rgba(201,169,110,0.45)' : 'rgba(201,169,110,0.85)',
        }}>
          {v.code}
        </span>
      </div>

      {/* Bottom row: expiry / used date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {v.is_used && v.used_at ? (
          <p style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.72rem',
            color: 'rgba(250,250,248,0.3)',
            margin: 0,
          }}>
            Used on {fmtDate(v.used_at)}
          </p>
        ) : expired ? (
          <p style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.72rem',
            color: 'rgba(229,115,115,0.5)',
            margin: 0,
          }}>
            Expired {v.expires_at ? fmtDate(v.expires_at) : ''}
          </p>
        ) : v.expires_at ? (
          <p style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.72rem',
            color: 'rgba(250,250,248,0.35)',
            margin: 0,
          }}>
            Expires {fmtDate(v.expires_at)}
          </p>
        ) : (
          <p style={{
            fontFamily: "'Poppins',sans-serif",
            fontSize: '0.72rem',
            color: 'rgba(250,250,248,0.25)',
            margin: 0,
            fontStyle: 'italic',
          }}>
            No expiry
          </p>
        )}
      </div>
    </div>
  )
}

export default function RewardsPage() {
  const [visible, setVisible]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [vouchers, setVouchers] = useState<Voucher[]>([])

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)

    const session = getSession()
    if (!session?.id) {
      setLoading(false)
      return
    }

    fetch(`/api/rewards?userId=${session.id}`)
      .then(r => r.json())
      .then(data => { if (data.vouchers) setVouchers(data.vouchers) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const active  = vouchers.filter(v => !v.is_used && (!v.expires_at || new Date(v.expires_at) > now))
  const expired = vouchers.filter(v => !v.is_used && v.expires_at && new Date(v.expires_at) <= now)
  const used    = vouchers.filter(v => v.is_used)
  const hasAny  = vouchers.length > 0

  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#1C1C1C', paddingTop: '200px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
          marginBottom: '2.5rem',
        }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem,5vw,2.75rem)', fontWeight: 400, fontStyle: 'italic', color: '#FAFAF8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Rewards & Vouchers
          </h1>
          <div style={{ width: 48, height: 1, background: '#C9A96E', marginTop: '1rem', opacity: 0.7 }}/>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease',
          }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', color: 'rgba(250,250,248,0.3)' }}>
              Loading...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasAny && (
          <div style={{
            background: '#242424', border: '1px solid rgba(201,169,110,0.12)', borderRadius: 8,
            padding: '3rem 2rem', textAlign: 'center',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
          }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <GiftIcon />
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 400, color: '#FAFAF8', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
              No rewards yet
            </h2>
            <p className="font-sans" style={{ fontSize: '0.875rem', color: 'rgba(250,250,248,0.4)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto 1.75rem' }}>
              Complete visits and earn points to unlock exclusive rewards and vouchers.
            </p>
            <Link href="/booking" className="btn-gold" style={{ display: 'inline-flex' }}>Start Earning</Link>
          </div>
        )}

        {/* Voucher sections */}
        {!loading && hasAny && (
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
            display: 'flex', flexDirection: 'column', gap: '2rem',
          }}>

            {/* Active */}
            {active.length > 0 && (
              <div>
                <SectionLabel>Active Vouchers ({active.length})</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {active.map(v => <VoucherCard key={v.id} v={v} />)}
                </div>
              </div>
            )}

            {/* Expired (unused) */}
            {expired.length > 0 && (
              <div>
                <SectionLabel>Expired</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {expired.map(v => <VoucherCard key={v.id} v={v} dimmed />)}
                </div>
              </div>
            )}

            {/* Used */}
            {used.length > 0 && (
              <div>
                <SectionLabel>Used Vouchers</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {used.map(v => <VoucherCard key={v.id} v={v} dimmed />)}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer note */}
        {!loading && (
          <p style={{
            fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', fontStyle: 'italic',
            color: 'rgba(250,250,248,0.3)', textAlign: 'center', marginTop: '1.5rem',
            opacity: visible ? 1 : 0, transition: 'opacity 0.55s ease 0.2s',
          }}>
            Vouchers issued by your stylist will appear here.
          </p>
        )}

      </div>
    </main>
  )
}
