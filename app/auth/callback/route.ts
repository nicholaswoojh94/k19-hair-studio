import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') || '/appointments'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const user = data.session.user

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id, phone')
    .eq('id', user.id)
    .single()

  if (!existing) {
    await supabaseAdmin.from('users').insert({
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      email: user.email || '',
      phone: null,
      birthday: null,
    })
  }

  // If phone is missing (new signup or abandoned profile completion), collect it first
  if (!existing?.phone) {
    const completeUrl = `${origin}/auth/complete-profile?redirect=${encodeURIComponent(redirectTo)}`
    return NextResponse.redirect(completeUrl)
  }

  // Existing user with complete profile — set localStorage and go
  const finalUrl = `${origin}/auth/oauth-success?redirect=${encodeURIComponent(redirectTo)}`
  return NextResponse.redirect(finalUrl)
}
