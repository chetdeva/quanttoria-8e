import { AlarmClock, CalendarCheck, CalendarClock, Hourglass, Inbox, Timer } from 'lucide-react'
import { countdown, rangeBounds, type BookingItem, type BookingRole } from '@/lib/bookings'

const hours = (items: BookingItem[]) =>
  Math.round((items.reduce((sum, item) => sum + (Date.parse(item.endsAt) - Date.parse(item.startsAt)), 0) / 3600000) * 10) / 10

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Timer; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-display text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function BookingsStats({ items, role, now }: { items: BookingItem[]; role: BookingRole; now: number }) {
  const upcoming = items.filter(item => item.status === 'upcoming' && Date.parse(item.endsAt) > now).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const pending = items.filter(item => item.status === 'pending')

  if (role === 'student') {
    const next = upcoming[0]
    const wait = next ? Date.parse(next.startsAt) - now : 0
    return (
      <section aria-label="Booking summary" className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={AlarmClock}
          label="Next session"
          value={next ? (wait <= 0 ? 'In progress' : countdown(wait)) : 'None booked'}
          hint={next?.person}
        />
        <Stat icon={Hourglass} label="Total hours learned" value={`${hours(items.filter(item => item.status === 'completed'))} h`} />
        <Stat icon={CalendarClock} label="Upcoming sessions" value={String(upcoming.length)} />
      </section>
    )
  }

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const todayEnd = +startOfDay + 86400000
  const [monthFrom, monthTo] = rangeBounds('month', now)
  const monthItems = items.filter(item => item.status !== 'cancelled' && Date.parse(item.startsAt) >= monthFrom && Date.parse(item.startsAt) < monthTo)
  return (
    <section aria-label="Booking summary" className="grid gap-3 sm:grid-cols-3">
      <Stat
        icon={CalendarCheck}
        label="Classes today"
        value={String(upcoming.filter(item => Date.parse(item.startsAt) < todayEnd).length)}
        hint="Still to teach"
      />
      <Stat icon={Inbox} label="Pending requests" value={String(pending.length)} />
      <Stat icon={Timer} label="Booked this month" value={`${hours(monthItems)} h`} />
    </section>
  )
}
