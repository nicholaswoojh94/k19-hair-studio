'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'

// Self-contained browser client — PKCE flow required for OAuth code exchange.
// Not shared via lib/supabase.ts so this dormant file compiles without touching the shared lib.
function makeBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'pkce' } }
  )
}

function OAuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'
  const code = searchParams.get('code')

  useEffect(() => {
    async function finish() {
      const supabase = makeBrowserClient()

      let user: { id: string; email?: string; user_metadata?: Record<string, string> } | null = null

      if (code) {
        // Exchange code — PKCE verifier is available here in browser localStorage
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          router.push('/login?error=oauth_failed')
          return
        }
        user = data.session.user
      } else {
        // No code — check for an already-active session (e.g. accidental page reload)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        user = session.user
      }

      if (!user) {
        router.push('/login')
        return
      }

      // User setup via service-role API (users table has RLS with no policies — anon key is blocked)
      const res = await fetch('/api/auth/oauth-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
        }),
      })

      if (!res.ok) {
        router.push('/login?error=setup_failed')
        return
      }

      const { needsPhone, userData } = await res.json()

      if (needsPhone) {
        router.push(`/auth/complete-profile?redirect=${encodeURIComponent(redirectTo)}`)
        return
      }

      try {
        localStorage.setItem('k19_user', JSON.stringify({
          id: user.id,
          phone: userData.phone,
          name: userData.name || '',
          email: user.email || '',
          birthday: userData.birthday || '',
        }))
      } catch { /* ignore */ }

      router.push(redirectTo)
    }
    finish()
  }, [router, redirectTo, code])

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(201,169,110,0.3)', borderTopColor: '#C9A96E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}/>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', color: 'rgba(250,250,248,0.4)' }}>Signing you in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function OAuthSuccessPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1C1C1C' }}/>}><OAuthSuccessContent /></Suspense>
}
