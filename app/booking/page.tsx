import { redirect } from 'next/navigation'

// Redirect to the static booking.html for now (served via Vercel)
// Replace with a proper Next.js page when backend is wired up
export default function BookingPage() {
  redirect('/booking.html')
}
