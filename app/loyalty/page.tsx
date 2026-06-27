'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { getSession } from '@/lib/session'

type Transaction = {
  id: string
  points: number
  type: string
  description: string
  created_at: string
  expires_at: string | null
  is_expired: boolean
}

type Voucher = {
  id: string
  code: string
  type: string
  value: number
  expires_at: string | null
}

export default function LoyaltyPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalRedeemed, setTotalRedeemed] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    const user = getSession()
    if (user?.id) {
      setUserId(user.id)
      fetchLoyalty(user.id)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchLoyalty(id: string) {
    try {
      const res = await fetch(`/api/loyalty?userId=${id}`)
      const data = await res.json()
      if (res.ok) {
        setBalance(data.balance || 0)
        setTotalEarned(data.totalEarned || 0)
        setTotalRedeemed(data.totalRedeemed || 0)
        setTransactions(data.transactions || [])
        setVouchers(data.vouchers || [])
        setSettings(data.settings || {})
      }
    } catch (err) {
      console.error('Failed to fetch loyalty:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function getVoucherLabel(v: Voucher) {
    if (v.type === 'discount_rm') return `RM ${v.value} Off`
    if (v.type === 'discount_pct') return `${v.value}% Off`
    if (v.type === 'free_service') return 'Free Service'
    return `RM ${v.value} Off`
  }

  const pointsPerRm = settings.loyalty_points_per_rm || '1'
  const expiryEnabled = settings.loyalty_expiry_enabled === 'true'
  const expiryDays = settings.loyalty_expiry_days || '365'

  return (
    <main style={{
      minHeight: '100vh',
      background: '#1C1C1C',
      paddingTop: '160px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
          marginBottom: '2.5rem',
        }}>
          <h1 className="font-serif" style={{
            fontSize: 'clamp(1.8rem,5vw,2.75rem)',
            fontWeight: 400, fontStyle: 'italic',
            color: '#FAFAF8', letterSpacing: '-0.02em',
            lineHeight: 1.2, margin: 0,
          }}>
            Loyalty Points
          </h1>
          <div style={{
            width: 48, height: 1,
            background: '#C9A96E',
            marginTop: '1rem', opacity: 0.7,
          }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spinner size={24} color="#C9A96E" />
          </div>
        ) : (
          <>
            {/* Balance card */}
            <div style={{
              background: 'linear-gradient(135deg, #242424, #2A2A2A)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: 12,
              padding: '32px',
              marginBottom: 20,
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.55s ease 0.1s',
            }}>
              <p style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,250,248,0.35)',
                margin: '0 0 8px',
              }}>
                Current Balance
              </p>
              <p style={{
                fontFamily: "'Lora',serif",
                fontSize: '3.5rem',
                fontWeight: 400,
                color: '#C9A96E',
                margin: '0 0 4px',
                lineHeight: 1,
              }}>
                {balance.toLocaleString()}
              </p>
              <p style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: '0.78rem',
                color: 'rgba(250,250,248,0.35)',
                margin: '0 0 24px',
              }}>
                points
              </p>

              {/* Stats row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                paddingTop: 20,
                borderTop: '1px solid rgba(201,169,110,0.1)',
              }}>
                <div>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.68rem',
                    color: 'rgba(250,250,248,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 4px',
                  }}>
                    Total Earned
                  </p>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#4CAF50',
                    margin: 0,
                  }}>
                    +{totalEarned.toLocaleString()} pts
                  </p>
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.68rem',
                    color: 'rgba(250,250,248,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 4px',
                  }}>
                    Total Redeemed
                  </p>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'rgba(250,250,248,0.5)',
                    margin: 0,
                  }}>
                    -{totalRedeemed.toLocaleString()} pts
                  </p>
                </div>
              </div>
            </div>

            {/* How to earn */}
            <div style={{
              background: '#242424',
              border: '1px solid rgba(201,169,110,0.1)',
              borderRadius: 12,
              padding: '24px',
              marginBottom: 20,
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.55s ease 0.15s',
            }}>
              <p style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(201,169,110,0.7)',
                margin: '0 0 16px',
              }}>
                How to Earn
              </p>
              {[
                {
                  icon: '✂️',
                  title: 'Every Visit',
                  desc: `Earn ${pointsPerRm} point${pointsPerRm !== '1' ? 's' : ''} for every RM1 spent`,
                },
                {
                  icon: '🎂',
                  title: 'Birthday Month',
                  desc: 'Earn 2× points during your birthday month',
                },
                {
                  icon: '👥',
                  title: 'Refer a Friend',
                  desc: 'Earn bonus points when a friend visits',
                },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  paddingBottom: i < 2 ? '14px' : 0,
                  marginBottom: i < 2 ? '14px' : 0,
                  borderBottom: i < 2 ? '1px solid rgba(201,169,110,0.06)' : 'none',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>
                    {item.icon}
                  </span>
                  <div>
                    <p style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: '#FAFAF8',
                      margin: '0 0 2px',
                    }}>
                      {item.title}
                    </p>
                    <p style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.75rem',
                      color: 'rgba(250,250,248,0.4)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

              {expiryEnabled && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(201,169,110,0.06)',
                }}>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.72rem',
                    color: 'rgba(250,250,248,0.25)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    ⚠️ Points expire after {expiryDays} days of inactivity.
                  </p>
                </div>
              )}
            </div>

            {/* Vouchers */}
            {vouchers.length > 0 && (
              <div style={{
                background: '#242424',
                border: '1px solid rgba(201,169,110,0.1)',
                borderRadius: 12,
                padding: '24px',
                marginBottom: 20,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.55s ease 0.2s',
              }}>
                <p style={{
                  fontFamily: "'Poppins',sans-serif",
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(201,169,110,0.7)',
                  margin: '0 0 16px',
                }}>
                  Your Vouchers
                </p>
                {vouchers.map((v, i) => (
                  <div key={v.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: i < vouchers.length - 1
                      ? '1px solid rgba(201,169,110,0.06)'
                      : 'none',
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#C9A96E',
                        margin: '0 0 4px',
                      }}>
                        {getVoucherLabel(v)}
                      </p>
                      <p style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.72rem',
                        color: 'rgba(250,250,248,0.35)',
                        margin: 0,
                        letterSpacing: '0.06em',
                      }}>
                        {v.code}
                        {v.expires_at
                          ? ` · Expires ${formatDate(v.expires_at)}`
                          : ' · No expiry'}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(201,169,110,0.1)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#C9A96E',
                      letterSpacing: '0.06em',
                    }}>
                      ACTIVE
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transaction history */}
            <div style={{
              background: '#242424',
              border: '1px solid rgba(201,169,110,0.1)',
              borderRadius: 12,
              padding: '24px',
              marginBottom: 20,
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.55s ease 0.25s',
            }}>
              <p style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(201,169,110,0.7)',
                margin: '0 0 16px',
              }}>
                Transaction History
              </p>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif",
                    fontSize: '0.85rem',
                    color: 'rgba(250,250,248,0.3)',
                    margin: '0 0 16px',
                  }}>
                    No transactions yet.
                  </p>
                  <Link href="/booking" className="btn-gold"
                    style={{ fontSize: '0.72rem', height: 38, padding: '0 20px' }}>
                    Book Now to Earn Points
                  </Link>
                </div>
              ) : (
                transactions.map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: i < transactions.length - 1
                      ? '1px solid rgba(201,169,110,0.06)'
                      : 'none',
                    opacity: t.is_expired ? 0.4 : 1,
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.82rem',
                        color: '#FAFAF8',
                        margin: '0 0 3px',
                      }}>
                        {t.description}
                      </p>
                      <p style={{
                        fontFamily: "'Poppins',sans-serif",
                        fontSize: '0.72rem',
                        color: 'rgba(250,250,248,0.3)',
                        margin: 0,
                      }}>
                        {formatDate(t.created_at)}
                        {t.is_expired ? ' · Expired' : ''}
                        {t.expires_at && !t.is_expired
                          ? ` · Expires ${formatDate(t.expires_at)}`
                          : ''}
                      </p>
                    </div>
                    <p style={{
                      fontFamily: "'Poppins',sans-serif",
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: t.points > 0 ? '#4CAF50' : '#E57373',
                      margin: 0,
                      flexShrink: 0,
                    }}>
                      {t.points > 0 ? '+' : ''}{t.points} pts
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Coming soon notice */}
            <p style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: '0.75rem',
              color: 'rgba(250,250,248,0.2)',
              textAlign: 'center',
              fontStyle: 'italic',
              margin: 0,
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.55s ease 0.3s',
            }}>
              Points redemption coming soon. Keep visiting to build your balance.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
