import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    if (q.length < 2) {
      return NextResponse.json({ customers: [] })
    }

    const { data: customers } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, email')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8)

    return NextResponse.json({ customers: customers || [] })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
