import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  try {
    const { userId, name, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, phone, name, email, birthday')
      .eq('id', userId)
      .single()

    if (!existing) {
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({ id: userId, name: name || '', email: email || '', phone: null, birthday: null })
        .select('id, phone, name, email, birthday')
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ needsPhone: true, userData: newUser })
    }

    return NextResponse.json({ needsPhone: !existing.phone, userData: existing })

  } catch (err) {
    console.error('oauth-setup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
