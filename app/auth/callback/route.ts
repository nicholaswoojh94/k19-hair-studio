import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') || '/appointments'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Pass code to client page — PKCE verifier lives in browser localStorage,
  // so exchangeCodeForSession must run in the browser, not here server-side.
  return NextResponse.redirect(
    `${origin}/auth/oauth-success?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(redirectTo)}`
  )
}
