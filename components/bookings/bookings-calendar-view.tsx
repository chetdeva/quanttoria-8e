'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { dateInZone, dayInZone, timeInZone } from '@/lib/calendar/time'
import { statusLabel, statusStyle, type BookingItem } from '@/lib/bookings'
import { cn } from '@/lib/utils'

export function BookingsCalendarView({ items, timezone }: { items: BookingItem[]; timezone: string }) {
  const [day, setDay] = useState<Date>(() => new Date())
  const [month, setMonth] = useState<Date>(() => new Date())
  const key = dayInZone(day, timezone)
  const dayItems = items.filter(item => dayInZone(item.startsAt, timezone) === key).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))

  return (
    <section aria-label="Calendar view" className="grid gap-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <Calendar
          mode="single"
          fixedWeeks
          weekStartsOn={1}
          timeZone={timezone}
          selected={day}
          month={month}
          onMonthChange={setMonth}
          onSelect={value => value && setDay(value)}
          modifiers={{ booked: date => items.some(item => item.status !== 'cancelled' && dayInZone(item.startsAt, timezone) === dayInZone(date, timezone)) }}
          modifiersClassNames={{ booked: 'font-bold underline decoration-primary decoration-2 underline-offset-4' }}
          className="w-full"
        />
        <p className="mt-3 text-center text-xs text-muted-foreground">Underlined dates have sessions. Times shown in {timezone.replaceAll('_', ' ')}.</p>
      </div>
      <div className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
        <h2 className="font-display text-lg font-bold">{dateInZone(day, timezone)}</h2>
        <ul className="mt-3 space-y-2">
          {dayItems.map(item => (
            <li key={item.id} className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-bold text-primary">
                {timeInZone(item.startsAt, timezone)} – {timeInZone(item.endsAt, timezone)}
              </p>
              <p className="mt-0.5 font-bold">{item.person}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-muted-foreground">{item.subject}</p>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold', statusStyle[item.status])}>
                  {statusLabel[item.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {!dayItems.length && <p className="mt-3 text-sm text-muted-foreground">No sessions on this day.</p>}
      </div>
    </section>
  )
}
