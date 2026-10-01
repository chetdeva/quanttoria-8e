'use client'

import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import { CalendarPlus, CheckCircle2, Clock, FileText, Globe, MoreHorizontal, Star, Video, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { canJoin, countdown, safeHttpsUrl, statusLabel, statusStyle, JOIN_WINDOW_MS, type BookingItem, type BookingRole } from '@/lib/bookings'
import { dateInZone, timeInZone } from '@/lib/calendar/time'
import { cn } from '@/lib/utils'

type Props = {
  item: BookingItem
  role: BookingRole
  timezone: string
  now: number
  busy: boolean
  scheduleHref: string
  onCancel: (item: BookingItem) => void
  onComplete: (item: BookingItem) => void
}

const menuItem =
  'flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[focused]:bg-muted data-[disabled]:opacity-50'

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?'
}

export function BookingCard({ item, role, timezone, now, busy, scheduleHref, onCancel, onComplete }: Props) {
  const start = Date.parse(item.startsAt)
  const duration = Math.round((Date.parse(item.endsAt) - start) / 60000)
  const joinable = canJoin(item, now)
  const meeting = safeHttpsUrl(item.meetingUrl)
  const waitMs = start - JOIN_WINDOW_MS - now
  const isLive = item.status === 'upcoming' && start <= now
  const future = start > now
  const manageable = item.status === 'upcoming' && future

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky font-display text-base font-bold text-primary"
        >
          {initials(item.person)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold leading-tight">{item.person}</h3>
            <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-bold', statusStyle[item.status])}>
              {statusLabel[item.status]}
            </span>
            {item.classType === 'trial' && (
              <span className="rounded-full border border-border bg-mint/30 px-2.5 py-0.5 text-xs font-bold">Trial</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{item.subject}</span>
            {item.gradeRange && ` · ${item.gradeRange}`}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Date</dt>
              <dd>{dateInZone(item.startsAt, timezone)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Time</dt>
              <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
              <dd>
                {timeInZone(item.startsAt, timezone)} – {timeInZone(item.endsAt, timezone)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <dt className="sr-only">Duration and timezone</dt>
              <Globe className="size-4" aria-hidden="true" />
              <dd>
                {duration} min · {timezone.replaceAll('_', ' ')}
              </dd>
            </div>
          </dl>
          {item.topic && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{role === 'teacher' ? `Student goal: ${item.topic}` : item.topic}</span>
            </p>
          )}
          <p className="mt-1 font-mono text-xs text-muted-foreground">ID {item.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-col lg:items-stretch">
        {item.status === 'upcoming' && (
          <>
            {joinable || isLive ? (
              meeting ? (
                <Button nativeButton={false} render={<a href={meeting} target="_blank" rel="noopener noreferrer" />}>
                  <Video />
                  {role === 'teacher' ? 'Launch Virtual Classroom' : 'Join Class'}
                </Button>
              ) : (
                <Button disabled>
                  <Video />
                  Meeting link pending
                </Button>
              )
            ) : (
              <Button disabled aria-label={`Join available ${countdown(Math.max(waitMs, 60000))}`}>
                <Video />
                {role === 'teacher' ? 'Classroom opens' : 'Join'} {countdown(Math.max(waitMs, 60000))}
              </Button>
            )}
          </>
        )}
        {role === 'student' && item.status === 'completed' && (
          <Button variant="outline" nativeButton={false} render={<a href={scheduleHref} />}>
            <Star />
            Book again
          </Button>
        )}
        {role === 'teacher' && item.status === 'upcoming' && isLive && (
          <Button variant="outline" disabled={busy} onClick={() => onComplete(item)}>
            <CheckCircle2 />
            Mark complete
          </Button>
        )}
        {role === 'teacher' && item.status === 'completed' && Date.parse(item.endsAt) <= now && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Session ended
          </span>
        )}

        <MenuTrigger>
          <Button variant="outline" size="icon" aria-label={`More actions for ${item.person}`}>
            <MoreHorizontal />
          </Button>
          <Popover placement="bottom end" className="z-50 min-w-52 rounded-xl border border-border bg-card p-1.5 text-foreground shadow-xl">
            <Menu
              aria-label={`Actions for booking with ${item.person}`}
              className="outline-none"
              onAction={key => {
                if (key === 'cancel') onCancel(item)
                if (key === 'complete') onComplete(item)
              }}
            >
              {manageable && (
                <MenuItem className={menuItem} href={scheduleHref}>
                  <Clock className="size-4" aria-hidden="true" />
                  Reschedule
                </MenuItem>
              )}
              {item.bookingId && item.status !== 'cancelled' && (
                <MenuItem className={menuItem} href={`/api/calendar/bookings/${item.bookingId}/calendar`} download>
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Add to Google / iCal
                </MenuItem>
              )}
              {role === 'teacher' && item.status === 'upcoming' && isLive && (
                <MenuItem id="complete" className={menuItem}>
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Mark attendance / complete
                </MenuItem>
              )}
              {role === 'student' && manageable && (
                <MenuItem id="cancel" className={cn(menuItem, 'text-destructive')}>
                  <XCircle className="size-4" aria-hidden="true" />
                  Cancel booking
                </MenuItem>
              )}
              {!manageable && !item.bookingId && !(role === 'teacher' && isLive) && (
                <MenuItem className={menuItem} isDisabled>
                  No actions available
                </MenuItem>
              )}
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
    </article>
  )
}
