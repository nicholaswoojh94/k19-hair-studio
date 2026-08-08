import { createClient } from '@supabase/supabase-js'
import sanitizeHtml from 'sanitize-html'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  robots: { index: true, follow: true },
}

const ALLOWED_TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br']
const ALLOWED_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
}

async function fetchPrivacyPage() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
    )
    const { data, error } = await db
      .from('site_pages')
      .select('title, content, updated_at')
      .eq('key', 'privacy_policy')
      .single()

    if (error || !data) return null
    return data as { title: string; content: string; updated_at: string }
  } catch {
    return null
  }
}

export default async function PrivacyPage() {
  const page = await fetchPrivacyPage()

  const formattedDate = page?.updated_at
    ? new Date(page.updated_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const safeHtml = page?.content
    ? sanitizeHtml(page.content, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRS })
    : null

  return (
    <>
      <style>{`
        .privacy-body { background: #F5F5F5; min-height: 100vh; padding: 120px 24px 80px; }
        .privacy-article { max-width: 720px; margin: 0 auto; }
        .privacy-article h2 {
          font-family: 'Lora', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #121212;
          margin: 2em 0 0.6em;
          line-height: 1.4;
        }
        .privacy-article h3 {
          font-family: 'Lora', Georgia, serif;
          font-size: 1rem;
          font-weight: 600;
          color: #121212;
          margin: 1.5em 0 0.5em;
        }
        .privacy-article p {
          font-family: 'Poppins', system-ui, sans-serif;
          font-size: 0.9rem;
          line-height: 1.85;
          color: rgba(18,18,18,0.75);
          margin: 0 0 1em;
        }
        .privacy-article ul, .privacy-article ol {
          font-family: 'Poppins', system-ui, sans-serif;
          font-size: 0.9rem;
          line-height: 1.85;
          color: rgba(18,18,18,0.75);
          padding-left: 1.5em;
          margin: 0 0 1em;
        }
        .privacy-article li { margin-bottom: 0.35em; }
        .privacy-article a { color: #C9A96E; text-decoration: underline; }
        .privacy-article strong { font-weight: 600; color: #121212; }
        .privacy-back { font-family: 'Poppins',sans-serif; font-size: 0.75rem; color: rgba(18,18,18,0.4); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 2rem; letter-spacing: 0.04em; transition: color 0.2s ease; }
        .privacy-back:hover { color: #C9A96E; }
        @media (max-width: 640px) {
          .privacy-body { padding: 100px 20px 60px; }
          .privacy-article h2 { font-size: 1rem; }
        }
      `}</style>

      <div className="privacy-body">
        <article className="privacy-article">

          {/* Back link */}
          <Link href="/" className="privacy-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to home
          </Link>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(18,18,18,0.1)' }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A96E', margin: '0 0 12px', fontWeight: 500 }}>
              K19 Hair Studio
            </p>
            <h1 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, fontStyle: 'italic', color: '#121212', margin: '0 0 12px', lineHeight: 1.2 }}>
              {page?.title || 'Privacy Policy'}
            </h1>
            {formattedDate && (
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: 'rgba(18,18,18,0.4)', margin: 0 }}>
                Last updated: {formattedDate}
              </p>
            )}
          </div>

          {safeHtml ? (
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.9rem', color: 'rgba(18,18,18,0.4)' }}>
                Privacy policy coming soon.
              </p>
            </div>
          )}

        </article>
      </div>
    </>
  )
}
