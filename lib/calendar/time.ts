import type { Availability, Booking, Session, Slot } from './types'

export function groupBookings(bookings: Booking[], zone: string, now = Date.now()) {
  const today = dayInZone(new Date(now), zone)
  const sorted = bookings.filter(b => b.class_sessions).slice().sort((a,b) => Date.parse(a.class_sessions!.starts_at)-Date.parse(b.class_sessions!.starts_at))
  return {
    today: sorted.filter(b => b.status==='confirmed' && dayInZone(b.class_sessions!.starts_at,zone)===today),
    upcoming: sorted.filter(b => b.status==='confirmed' && Date.parse(b.class_sessions!.starts_at)>now && dayInZone(b.class_sessions!.starts_at,zone)!==today),
    history: sorted.filter(b => b.status!=='confirmed' || dayInZone(b.class_sessions!.starts_at,zone)<today).reverse(),
  }
}

export function dayInZone(value: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}
export function timeInZone(value: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
}
export function dateInZone(value: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(value))
}
function wall(value: number, zone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(value)
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return { day: `${p.year}-${p.month}-${p.day}`, weekday: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday), minute: Number(p.hour)*60+Number(p.minute) }
}
const minutes = (time: string) => Number(time.slice(0,2))*60+Number(time.slice(3,5))

// Iterate real UTC instants, not guessed offsets. Both fall-back occurrences
// exist independently; nonexistent spring-forward wall times never appear.
export function availableSlots(sessions: Session[], hours: Availability[], teacherId: string, date: string, zone: string, duration: number, now = Date.now()): Slot[] {
  if (!Number.isInteger(duration) || duration < 15 || duration > 180 || duration % 15 !== 0) return []
  const noon = Date.parse(`${date}T12:00:00Z`)
  const rows = sessions.filter(s => s.teacher_id === teacherId)
  const rules = hours.filter(h => h.teacher_id === teacherId && h.is_active)
  const slots: Slot[] = []
  for (let start = noon-36*3600000; start <= noon+36*3600000; start += 15*60000) {
    const end = start+duration*60000
    if (start <= now || dayInZone(new Date(start),zone)!==date) continue
    if (rows.some(s => ['confirmed','blocked'].includes(s.status) && Date.parse(s.starts_at)<end && Date.parse(s.ends_at)>start)) continue
    const published = rows.some(s => s.status==='open' && Date.parse(s.starts_at)<=start && Date.parse(s.ends_at)>=end)
    const recurring = rules.some(h => {
      const a = wall(start,h.timezone), b = wall(end,h.timezone)
      return a.weekday===h.day_of_week && a.day===b.day && a.minute>=minutes(h.start_time) && b.minute<=minutes(h.end_time) && b.minute-a.minute===duration
    })
    if (published || recurring) slots.push({ teacher_id: teacherId, starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString() })
  }
  return slots
}
