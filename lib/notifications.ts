export function formatNotificationTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function formatNotificationDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}
