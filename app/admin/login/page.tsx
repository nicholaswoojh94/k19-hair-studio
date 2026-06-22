'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return
      }

      router.push('/admin')

    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F8F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand_assets/K19_logo_black_transparent.png"
            alt="K19 Hair Studio"
            style={{ width: 160, height: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1C1C1C',
          margin: '0 0 4px 0',
          textAlign: 'center',
        }}>
          Admin Portal
        </h1>
        <p style={{
          fontSize: '0.82rem',
          color: 'rgba(0,0,0,0.4)',
          textAlign: 'center',
          margin: '0 0 32px 0',
        }}>
          K19 Hair Studio Dashboard
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.5)',
            marginBottom: 6,
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="kyan@k19hairstudio.com"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontFamily: "'Poppins',sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s ease',
              background: '#FAFAFA',
              color: '#1C1C1C',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.5)',
            marginBottom: 6,
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 42px 10px 14px',
                border: '1.5px solid rgba(0,0,0,0.12)',
                borderRadius: 6,
                fontSize: '0.9rem',
                fontFamily: "'Poppins',sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                background: '#FAFAFA',
                color: '#1C1C1C',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A96E')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p style={{
            color: '#E53935',
            fontSize: '0.8rem',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            padding: '12px',
            background: loading || !email || !password
              ? 'rgba(201,169,110,0.4)'
              : 'linear-gradient(110deg, #A8833E 0%, #A8833E 35%, #F0D090 50%, #A8833E 65%, #A8833E 100%)',
            backgroundSize: '200% 100%',
            animation: loading || !email || !password ? 'none' : 'shimmer2 2.6s infinite linear',
            border: '1.5px solid rgba(201,169,110,0.6)',
            borderRadius: 6,
            color: '#1C1C1C',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 0.2s ease',
            fontFamily: "'Poppins',sans-serif",
          }}
        >
          {loading ? (
            <>
              <Spinner size={16} color="#1C1C1C" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: '0.75rem',
          color: 'rgba(0,0,0,0.35)',
        }}>
          Forgot password? Contact your administrator.
        </p>
      </div>

      <style>{`
        @keyframes shimmer2 {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
