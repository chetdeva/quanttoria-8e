'use client'

import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, Check, Clock3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarDialog } from '@/components/ui/calendar-dialog'
import { dateInZone, groupBookings, timeInZone } from '@/lib/calendar/time'
import { joinLink } from '@/lib/calendar/booking-rules'
import type { Booking, Teacher } from '@/lib/calendar/types'

type Props = {
  bookings: Booking[]
  teachers: Teacher[]
  timezone: string
  busy: boolean
  loading: boolean
  focusBooking: string
  onReschedule: (booking: Booking) => void
  onCancel: (booking: Booking) => void
  onBook: () => void
}

export function StudentAgenda({ bookings, teachers, timezone, busy, loading, focusBooking, onReschedule, onCancel, onBook }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null)
  const [now, setNow] = useState(()=>Date.now())
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return ()=>clearInterval(timer)},[])
  const detail = bookings.find(b => b.id === detailId)
  const groups = groupBookings(bookings, timezone, now)
  const teacherFor = (booking: Booking) => teachers.find(t => t.teacher_id === booking.class_sessions?.teacher_id)
  const canJoin = (booking: Booking) => !!joinLink(booking,now)

  function card(booking: Booking, isToday = false) {
    const session = booking.class_sessions!
    const teacher = teacherFor(booking)
    const duration = Math.round((Date.parse(session.ends_at)-Date.parse(session.starts_at))/60000)
    return <article key={booking.id} className={`flex flex-wrap items-center gap-3 rounded-xl border bg-background p-4 ${focusBooking===booking.id?'border-primary':'border-border'}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky text-primary"><BookOpen className="size-5" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-bold text-primary">{!isToday && `${dateInZone(session.starts_at,timezone)} · `}{timeInZone(session.starts_at,timezone)}</p>
        <h4 className="font-bold">{teacher?.subject || 'Math'}{booking.class_type==='trial'?' · Trial Class':''}</h4>
        <p className="text-sm text-muted-foreground">{teacher?.display_name || 'Your teacher'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{teacher?.grade_range && `${teacher.grade_range} · `}{duration} min</p>
        {isToday && !canJoin(booking) && <p className="mt-1 text-xs text-muted-foreground">{Date.parse(session.ends_at)<=now?'Class has ended':booking.meeting_status==='failed'?'Meeting setup needs attention · contact your teacher':'Meeting link pending · contact your teacher'}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {isToday && (canJoin(booking) ? <Button size="sm" nativeButton={false} render={<a href={booking.meeting_url!} target="_blank" rel="noopener noreferrer" />}>Join Class</Button> : <Button size="sm" disabled>Join Class</Button>)}
        <Button size="sm" variant="outline" aria-label={`View details for ${teacher?.subject || 'Math'} on ${dateInZone(session.starts_at,timezone)} at ${timeInZone(session.starts_at,timezone)}`} onClick={()=>setDetailId(booking.id)}>View Details</Button>
      </div>
    </article>
  }

  return <section aria-label="Your booked classes" className="mt-6 border-t border-border pt-5">
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-display text-lg font-bold">Today&apos;s Classes</h3><span className="rounded-full bg-sky px-2 py-1 text-xs font-bold text-primary">{groups.today.length}</span></div>
    <div className="space-y-3">{groups.today.map(b=>card(b,true))}</div>
    {!groups.today.length && <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">{loading?'Loading your classes…':'No classes today. A little space to practise!'}</p>}
    <h3 className="mt-5 mb-3 font-display text-lg font-bold">Upcoming</h3>
    <div className="max-h-80 space-y-3 overflow-y-auto">{groups.upcoming.map(b=>card(b))}</div>
    {!groups.upcoming.length && <p className="text-sm text-muted-foreground">{loading?'Loading…':'No upcoming classes yet. Book your next class above.'}</p>}
    {!!groups.history.length && <details className="mt-5"><summary className="cursor-pointer text-sm font-bold text-muted-foreground">Past &amp; cancelled classes ({groups.history.length})</summary><div className="mt-3 max-h-72 space-y-3 overflow-y-auto">{groups.history.map(b=>card(b))}</div></details>}
    <div className="mt-5 flex justify-end"><Button variant="outline" size="sm" onClick={onBook} disabled={busy}><Plus className="size-4" />Book a Class</Button></div>

    <CalendarDialog open={!!detail?.class_sessions} onClose={()=>setDetailId(null)} title={detail?.class_type==='trial'?'Trial Math Class':'Class Details'} busy={busy}>
      {detail?.class_sessions && <div className="space-y-4">
        <div><h3 className="font-display text-xl font-bold">{teacherFor(detail)?.subject || 'Math'} Class</h3><p className="text-sm text-muted-foreground">{teacherFor(detail)?.display_name || 'Your teacher'}</p></div>
        <p className="font-bold">{dateInZone(detail.class_sessions.starts_at,timezone)}</p>
        <p className="text-sm">{timeInZone(detail.class_sessions.starts_at,timezone)} – {timeInZone(detail.class_sessions.ends_at,timezone)}<br />{timezone}</p>
        <p className="text-sm capitalize">Status: {detail.status}</p>
        {detail.topic && <p className="text-sm">Topic: {detail.topic}</p>}
        {detail.status==='confirmed' && <>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="size-4 text-primary" />Teacher confirmed</li>
            <li className="flex items-center gap-2">{detail.meeting_status==='ready'?<Check className="size-4 text-primary" />:<Clock3 className="size-4 text-muted-foreground" />}{detail.meeting_status==='ready'?`${detail.video_provider==='zoom'?'Zoom':'Google Meet'} meeting created`:detail.meeting_status==='failed'?'Meeting setup needs attention':'Meeting pending · teacher will share a link'}</li>
            <li className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" />{detail.calendar_status==='invited'?'Calendar invitation sent · accept to add':'Not yet added to your calendar'}</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            {canJoin(detail) ? <Button nativeButton={false} render={<a href={detail.meeting_url!} target="_blank" rel="noopener noreferrer" />}>Join Class</Button> : <Button disabled>Join Class</Button>}
            <Button variant="outline" disabled={busy||Date.parse(detail.class_sessions.starts_at)<=Date.now()} onClick={()=>{setDetailId(null);onReschedule(detail)}}>Reschedule</Button>
            <Button variant="outline" disabled={busy||Date.parse(detail.class_sessions.starts_at)<=Date.now()} onClick={()=>{setDetailId(null);onCancel(detail)}}>Cancel</Button>
          </div>
        </>}
        <a className="inline-block text-sm font-bold text-primary underline underline-offset-4" href={`/api/calendar/bookings/${detail.id}/calendar`}>Add to your calendar (.ics)</a>
      </div>}
    </CalendarDialog>
  </section>
}
