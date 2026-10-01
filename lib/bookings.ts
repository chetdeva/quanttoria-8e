import type { Booking, Session, Teacher } from '@/lib/calendar/types'

export type BookingRole = 'student' | 'teacher'
export type BookingStatus = 'upcoming' | 'pending' | 'completed' | 'cancelled'
export type StatusFilter = 'all' | BookingStatus
export type RangePreset = 'week' | 'month' | 'all'

export type BookingItem = {
  id: string
  bookingId: string | null
  sessionId: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  person: string
  subject: string
  gradeRange: string
  topic: string | null
  classType: 'trial' | 'regular'
  meetingUrl: string | null
  provider: 'zoom' | 'google_meet' | null
}

export const JOIN_WINDOW_MS = 10 * 60 * 1000

export function deriveStatus(rawStatus: string, sessionStatus: string, endsAt: string, now: number): BookingStatus {
  if (rawStatus === 'cancelled' || sessionStatus === 'cancelled') return 'cancelled'
  if (rawStatus === 'pending' || sessionStatus === 'pending') return 'pending'
  if (rawStatus === 'completed' || sessionStatus === 'completed' || Date.parse(endsAt) <= now) return 'completed'
  return 'upcoming'
}

export function studentItems(bookings: Booking[], teachers: Teacher[], now: number): BookingItem[] {
  return bookings.flatMap(booking => {
    const session = booking.class_sessions
    if (!session) return []
    const teacher = teachers.find(t => t.teacher_id === session.teacher_id)
    return [{
      id: booking.id,
      bookingId: booking.id,
      sessionId: session.id,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      status: deriveStatus(booking.status, session.status, session.ends_at, now),
      person: teacher?.display_name || 'Your tutor',
      subject: teacher?.subject || 'Maths',
      gradeRange: teacher?.grade_range || '',
      topic: booking.topic,
      classType: booking.class_type,
      meetingUrl: booking.meeting_url,
      provider: booking.video_provider,
    }]
  })
}

export type TeacherMeeting = { session_id: string; meeting_url: string | null; topic: string | null; class_type: 'trial' | 'regular'; video_provider: 'zoom' | 'google_meet' }

export function teacherItems(sessions: Session[], students: Record<string, string>, meetings: Record<string, TeacherMeeting>, now: number): BookingItem[] {
  return sessions.flatMap(session => {
    const student = students[session.id]
    if (!student || ['open', 'blocked'].includes(session.status)) return []
    const meeting = meetings[session.id]
    return [{
      id: session.id,
      bookingId: null,
      sessionId: session.id,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      status: deriveStatus(session.status, session.status, session.ends_at, now),
      person: student,
      subject: session.title,
      gradeRange: '',
      topic: meeting?.topic ?? session.topic,
      classType: meeting?.class_type ?? 'regular',
      meetingUrl: meeting?.meeting_url ?? null,
      provider: meeting?.video_provider ?? null,
    }]
  })
}

export function safeHttpsUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

export function canJoin(item: BookingItem, now: number) {
  return item.status === 'upcoming' && !!safeHttpsUrl(item.meetingUrl) && Date.parse(item.startsAt) - now <= JOIN_WINDOW_MS
}

export function countdown(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60000))
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `in ${hours} hr${hours === 1 ? '' : 's'}${minutes % 60 && hours < 6 ? ` ${minutes % 60} min` : ''}`
  return `in ${Math.floor(hours / 24)} days`
}

export function rangeBounds(preset: RangePreset, now: number): [number, number] {
  if (preset === 'all') return [-Infinity, Infinity]
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  if (preset === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return [+start, +end]
  }
  return [+new Date(today.getFullYear(), today.getMonth(), 1), +new Date(today.getFullYear(), today.getMonth() + 1, 1)]
}

export function filterItems(items: BookingItem[], opts: { query: string; status: StatusFilter; range: RangePreset; now: number }) {
  const q = opts.query.trim().toLowerCase()
  const [from, to] = rangeBounds(opts.range, opts.now)
  return items
    .filter(item => {
      const start = Date.parse(item.startsAt)
      if (start < from || start >= to) return false
      if (opts.status !== 'all' && item.status !== opts.status) return false
      return !q || [item.person, item.subject, item.topic ?? '', item.id].some(field => field.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      const aUp = a.status === 'upcoming' || a.status === 'pending'
      const bUp = b.status === 'upcoming' || b.status === 'pending'
      if (aUp !== bUp) return aUp ? -1 : 1
      return aUp ? Date.parse(a.startsAt) - Date.parse(b.startsAt) : Date.parse(b.startsAt) - Date.parse(a.startsAt)
    })
}

export const statusLabel: Record<BookingStatus, string> = {
  upcoming: 'Upcoming',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const statusStyle: Record<BookingStatus, string> = {
  upcoming: 'bg-primary/10 text-primary border-primary/20',
  pending: 'bg-accent/40 text-foreground border-accent',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const cancelReasons = ['Schedule conflict', 'Not feeling well', 'Booked by mistake', 'Found a better time', 'Other']
