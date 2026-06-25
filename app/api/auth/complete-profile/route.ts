import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { userId, phone, birthday } = await req.json()

    if (!userId || !phone) {
      return NextResponse.json({ error: 'userId and phone are required' }, { status: 400 })
    }

    const updates: Record<string, string> = { phone }
    if (birthday) updates.birthday = birthday

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, user })

  } catch (err) {
    console.error('Complete profile error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
