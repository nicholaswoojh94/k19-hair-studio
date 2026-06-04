import type { Metadata } from 'next'
import { Lora, Poppins } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/context/LanguageContext'
import Nav from '@/components/Nav'
import WhatsAppButton from '@/components/WhatsAppButton'

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

export const metadata: Metadata = {
  title: 'K19 Hair Studio — Where Style Meets Artistry',
  description: 'K19 Hair Studio — Premium hair cuts, colour, and treatments. Expert stylists dedicated to bringing out your best.',
  openGraph: {
    title: 'K19 Hair Studio',
    description: 'Where style meets artistry. Book your appointment today.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${poppins.variable}`}>
      <body>
        <LanguageProvider>
          <Nav />
          {children}
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  )
}
