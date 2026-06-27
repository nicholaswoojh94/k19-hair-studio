import type { Metadata } from 'next'
import { Lora, Poppins } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/context/LanguageContext'
import ConditionalNav from '@/components/ConditionalNav'
import ConditionalWhatsApp from '@/components/ConditionalWhatsApp'

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

const SITE_URL = 'https://www.k19hairstudio.com'
const FALLBACK_OG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop'
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function fetchHeroImageUrl(): Promise<string> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?select=value&key=eq.hero_image_url`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 3600 },
      }
    )
    const rows: { value: string }[] = await res.json()
    return rows[0]?.value || FALLBACK_OG
  } catch {
    return FALLBACK_OG
  }
}

async function fetchBusinessHours(): Promise<{ day_of_week: number; opening_time: string; closing_time: string; is_closed: boolean }[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/business_hours?select=day_of_week,opening_time,closing_time,is_closed&order=day_of_week.asc`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 3600 },
      }
    )
    return await res.json()
  } catch {
    return []
  }
}

// Task 1 — root metadata with metadataBase and title template.
// Task 3 — OG image sourced from admin-configured hero, falls back to placeholder.
export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await fetchHeroImageUrl()
  const desc = 'K19 Hair Studio is a boutique hair salon in Damansara Damai, Petaling Jaya, offering expert cuts, colour, and treatments in an unhurried, personalised setting.'

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'K19 Hair Studio | Premium Hair Salon in Damansara Damai, PJ',
      template: '%s | K19 Hair Studio',
    },
    description: desc,
    openGraph: {
      type: 'website',
      siteName: 'K19 Hair Studio',
      locale: 'en_MY',
      url: SITE_URL,
      title: 'K19 Hair Studio | Premium Hair Salon in Damansara Damai, PJ',
      description: desc,
      images: [{ url: heroImage, width: 1200, height: 630, alt: 'K19 Hair Studio — Damansara Damai' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'K19 Hair Studio | Premium Hair Salon in Damansara Damai, PJ',
      description: desc,
      images: [heroImage],
    },
  }
}

// Task 6 — HairSalon JSON-LD with dynamic opening hours from business_hours table.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hours = await fetchBusinessHours()

  const openingHoursSpecification = hours
    .filter(h => !h.is_closed)
    .map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DOW[h.day_of_week]}`,
      opens: h.opening_time,
      closes: h.closing_time,
    }))

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'K19 Hair Studio',
    url: SITE_URL,
    telephone: '011-2778 5730',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'P2-1-09, The Zizz, 2, Jalan PJU 10/1a, Damansara Damai',
      addressLocality: 'Petaling Jaya',
      addressRegion: 'Selangor',
      postalCode: '47830',
      addressCountry: 'MY',
    },
  }
  if (openingHoursSpecification.length > 0) {
    jsonLd.openingHoursSpecification = openingHoursSpecification
  }

  return (
    <html lang="en" className={`${lora.variable} ${poppins.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <ConditionalNav />
          {children}
          <ConditionalWhatsApp />
        </LanguageProvider>
      </body>
    </html>
  )
}
