/**
 * UK wall-clock time to an instant, for code that runs on servers set to
 * UTC (Vercel). `new Date('2026-09-24T09:30:00')` and `setHours(9, 30)` are
 * evaluated in the server's zone, so on Vercel a 09:30 availability became
 * 09:30 UTC, which patients saw as 10:30 BST (Rachel Edwards, Smartway,
 * 24 Sep 2026). Only the pharmacy's local clock matters here.
 */

const LONDON = 'Europe/London'

/** Offset of Europe/London from UTC, in minutes, at the given instant. */
export function londonOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - at.getTime()) / 60000)
}

/** The instant at which it is `hh:mm` on `yyyy-mm-dd` in London. */
export function londonDateTime(dateKey: string, hour: number, minute: number): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0)
  // Two passes handle the offset changing across the DST boundary.
  const off1 = londonOffsetMinutes(new Date(guess))
  const t1 = guess - off1 * 60000
  const off2 = londonOffsetMinutes(new Date(t1))
  return new Date(guess - off2 * 60000)
}

/** Start of the London calendar day, as an instant. */
export function londonDayStart(dateKey: string): Date {
  return londonDateTime(dateKey, 0, 0)
}

/** ISO day of week in London for a yyyy-mm-dd: 0 = Sunday .. 6 = Saturday. */
export function londonDayOfWeek(dateKey: string): number {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: LONDON, weekday: 'short' }).format(londonDateTime(dateKey, 12, 0))
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

/** Today's London date as yyyy-mm-dd. */
export function londonToday(): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: LONDON, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
