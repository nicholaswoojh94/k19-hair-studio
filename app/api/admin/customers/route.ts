import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    let query = supabaseAdmin
      .from('users')
      .select('id, name, phone, email, birthday, created_at, is_active')
      .order('created_at', { ascending: false })

    if (q.length >= 2) {
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    }

    const { data: customers, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ customers: customers || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } }
  )
  try {
    const { name, phone, countryCode, email, birthday } = await req.json()

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const fullPhone = `${countryCode || '+60'}${phone.trim()}`

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', fullPhone)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This phone number already has an account.' },
        { status: 409 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone: fullPhone,
        country_code: countryCode || '+60',
        name: name.trim(),
        email: email?.trim() || null,
        birthday: birthday || null,
      })
      .select('id, name, phone, email, birthday, created_at, is_active')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
