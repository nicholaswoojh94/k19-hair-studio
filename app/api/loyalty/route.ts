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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get all loyalty transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('loyalty_points')
      .select(`
        id,
        points,
        type,
        description,
        created_at,
        expires_at,
        is_expired
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate balance
    const balance = (transactions || []).reduce((sum, t) =>
      t.is_expired ? sum : sum + t.points, 0)

    const totalEarned = (transactions || [])
      .filter(t => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0)

    const totalRedeemed = Math.abs((transactions || [])
      .filter(t => t.points < 0)
      .reduce((sum, t) => sum + t.points, 0))

    // Get loyalty settings
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .in('key', [
        'loyalty_points_per_rm',
        'loyalty_expiry_enabled',
        'loyalty_expiry_days'
      ])

    const settingsMap: Record<string, string> = {}
    ;(settings || []).forEach((s: any) => { settingsMap[s.key] = s.value })

    // Get vouchers
    const { data: vouchers } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_used', false)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      balance,
      totalEarned,
      totalRedeemed,
      transactions: transactions || [],
      vouchers: vouchers || [],
      settings: settingsMap,
    })

  } catch (err) {
    console.error('Loyalty route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
