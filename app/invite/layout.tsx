import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refer a Friend',
  robots: { index: false, follow: false },
}

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
