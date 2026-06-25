'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'

function OAuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/appointments'

  useEffect(() => {
    async function finish() {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const user = session.user
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, phone, email, birthday')
        .eq('id', user.id)
        .single()
      // Safety check — callback should have already redirected, but belt-and-suspenders
      if (!userData?.phone) {
        router.push(`/auth/complete-profile?redirect=${encodeURIComponent(redirectTo)}`)
        return
      }
      try {
        localStorage.setItem('k19_user', JSON.stringify({
          id: user.id,
          phone: userData.phone,
          name: userData?.name || user.user_metadata?.full_name || '',
          email: user.email || '',
          birthday: userData?.birthday || '',
        }))
      } catch { /* ignore */ }
      router.push(redirectTo)
    }
    finish()
  }, [router, redirectTo])

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
