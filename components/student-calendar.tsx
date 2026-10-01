'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, Video } from 'lucide-react'
import { StudentAgenda } from '@/components/student-agenda'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDialog } from '@/components/ui/calendar-dialog'
import { CalendarShell, type CalendarProps } from '@/components/calendar-shared'
import { calendarRequest, loadCalendar } from '@/lib/calendar/client'
import { availableSlots, dateInZone, dayInZone, timeInZone } from '@/lib/calendar/time'
import { requiredCredits, validDuration } from '@/lib/calendar/booking-rules'
import type { Booking, ClassType, Slot, Snapshot, VideoProvider } from '@/lib/calendar/types'

const empty: Snapshot = { teachers: [], sessions: [], availability: [], bookings: [] }
const inputClass = 'w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function StudentCalendar(props: CalendarProps) {
  const [data, setData] = useState<Snapshot>(empty)
  const [teacherId, setTeacherId] = useState('')
  const [classType, setClassType] = useState<ClassType>('regular')
  const [duration, setDuration] = useState(60)
  const [customDuration, setCustomDuration] = useState(false)
  const [provider, setProvider] = useState<VideoProvider>('zoom')
  const [day, setDay] = useState<Date>()
  const [month, setMonth] = useState<Date>()
  const [selected, setSelected] = useState<Slot | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [replacing, setReplacing] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [topic, setTopic] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [focusBooking, setFocusBooking] = useState('')
  const teacher = data.teachers.find(t => t.teacher_id === teacherId)
  const date = day ? dayInZone(day, timezone) : ''
  const creditsRequired = validDuration(duration) ? requiredCredits(duration) : null
  const slots = useMemo(() => date ? availableSlots(data.sessions, data.availability, teacherId, date, timezone, duration) : [], [data.sessions, data.availability, teacherId, date, timezone, duration])
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const snapshot = await loadCalendar(props.profileId)
      setData(snapshot)
      setTeacherId(current => current || snapshot.teachers[0]?.teacher_id || '')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load the calendar.') }
    finally { setLoading(false) }
  }, [props.profileId])
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York')
    const today = new Date()
    setDay(today); setMonth(today)
    void load()
  }, [load])
  useEffect(() => { setSelected(null) }, [teacherId, date, duration, timezone])

  async function book() {
    if (!selected || busy) return
    setBusy(true); setDialogError('')
    try {
      const result = await calendarRequest<{ id: string }>(`/bookings?userId=${props.profileId}`, { method: 'POST', body: JSON.stringify({ teacherId, startsAt: selected.starts_at, duration, classType, provider, topic, replaceId: replacing?.id }) })
      setFocusBooking(result.id); setConfirming(false); setReplacing(null); setSelected(null); setTopic('')
      setMessage(replacing ? 'Class rescheduled. Your new time is confirmed.' : 'Your class is confirmed. See meeting and calendar details below.')
      await load()
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Could not book this class.')
      await load()
    } finally { setBusy(false) }
  }
  async function cancel() {
    if (!cancelling || busy) return
    setBusy(true); setDialogError('')
    try {
      await calendarRequest(`/bookings/${cancelling.id}?userId=${props.profileId}`, { method: 'DELETE' })
      setCancelling(null); setMessage('Class cancelled. This time is available again.'); await load()
    } catch (error) { setDialogError(error instanceof Error ? error.message : 'Could not cancel this class.') }
    finally { setBusy(false) }
  }
  function reschedule(booking: Booking) {
    const session = booking.class_sessions
    if (!session) return
    setReplacing(booking); setTeacherId(session.teacher_id); setClassType(booking.class_type)
    const minutes = (Date.parse(session.ends_at) - Date.parse(session.starts_at))/60000
    setDuration(minutes); setCustomDuration(minutes !== 30 && minutes !== 60)
    setProvider(booking.video_provider); setTopic(booking.topic || ''); setSelected(null)
    setMessage('Choose a new time. Your existing reservation stays confirmed until the new time is secured.')
    document.getElementById('booking-page')?.scrollIntoView({ behavior: 'smooth' })
  }

  return <CalendarShell {...props} role="student" timezone={timezone} loading={loading} onRefresh={() => void load()}>
    {message && <p role="status" className="mb-5 rounded-xl border border-primary/20 bg-card p-4 text-sm">{message}</p>}
    <section id="booking-page" aria-label="Book a class" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[280px_1fr_260px]">
      <aside className="border-b border-border p-6 lg:border-r lg:border-b-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Teacher profile</p>
        <label htmlFor="booking-teacher" className="sr-only">Choose your teacher</label>
        <select id="booking-teacher" className={inputClass} value={teacherId} disabled={loading || !!replacing} onChange={event => setTeacherId(event.target.value)}>
          {!data.teachers.length && <option value="">No published teachers yet</option>}
          {data.teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.display_name}</option>)}
        </select>
        <h2 className="mt-4 font-display text-2xl font-bold">{teacher?.display_name || 'Choose a teacher'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{teacher ? `${teacher.subject} · ${teacher.grade_range}` : 'One-to-one maths coaching'}</p>
        <fieldset className="mt-6"><legend className="mb-2 text-sm font-bold">Choose class</legend><div className="flex gap-2">{(['regular', 'trial'] as const).map(type => <Button key={type} size="sm" variant={classType === type ? 'default' : 'outline'} aria-pressed={classType === type} onClick={() => setClassType(type)}>{type === 'trial' ? 'Trial Class' : 'Regular Class'}</Button>)}</div></fieldset>
        <fieldset className="mt-6"><legend className="mb-2 flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4" />Duration</legend><div className="flex flex-wrap gap-3">{([30,60] as const).map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="duration" value={value} checked={!customDuration && duration === value} onChange={() => {setCustomDuration(false);setDuration(value)}} className="accent-primary" />{value} min</label>)}<label className="flex items-center gap-2 text-sm"><input type="radio" name="duration" checked={customDuration} onChange={()=>setCustomDuration(true)} className="accent-primary" />Custom</label></div>{customDuration && <div className="mt-3"><label htmlFor="custom-duration" className="mb-2 block text-sm">Duration in minutes</label><input id="custom-duration" type="number" min={15} max={180} step={15} value={duration || ''} onChange={e=>setDuration(Number(e.target.value))} aria-describedby="duration-help" aria-invalid={!validDuration(duration)} className={inputClass} /><p id="duration-help" className="mt-1 text-xs text-muted-foreground">15–180 minutes, in 15-minute steps.</p></div>}</fieldset>
        <dl className="mt-5 space-y-2 rounded-xl border border-border bg-background p-3 text-sm" aria-label="Class credits"><div className="flex justify-between gap-2"><dt>Available credits</dt><dd className="font-bold">{loading ? 'Loading…' : data.availableCredits == null ? 'Not configured' : data.availableCredits}</dd></div><div className="flex justify-between gap-2"><dt>Credits required</dt><dd className="font-bold">{creditsRequired ?? '—'}</dd></div></dl><p className="mt-1 text-xs text-muted-foreground">1 credit per hour, prorated. Applies to both class types.</p>
        <label htmlFor="video-provider" className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold"><Video className="size-4" />Video call</label>
        <select id="video-provider" className={inputClass} value={provider} onChange={e => setProvider(e.target.value as VideoProvider)}><option value="zoom">Zoom</option><option value="google_meet">Google Meet</option></select>
        <label htmlFor="booking-timezone" className="mt-6 mb-2 block text-sm font-bold">Timezone</label>
        <select id="booking-timezone" className={inputClass} value={timezone} onChange={e => { setTimezone(e.target.value); setDay(undefined); setMonth(new Date()) }}>
          {Array.from(new Set([timezone,'America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Asia/Kolkata','UTC'])).map(zone => <option key={zone} value={zone}>{zone.replaceAll('_',' ')}</option>)}
        </select>
      </aside>
      <div className="flex min-w-0 flex-col border-b border-border p-6 lg:border-r lg:border-b-0">
        <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><CalendarDays className="size-5 text-primary" />Choose date</h3>
        <Calendar mode="single" fixedWeeks timeZone={timezone} selected={day} month={month} onMonthChange={setMonth} onSelect={setDay} weekStartsOn={1} modifiers={{ booked:date=>data.bookings.some(b=>b.status==='confirmed'&&b.class_sessions&&dayInZone(b.class_sessions.starts_at,timezone)===dayInZone(date,timezone)) }} modifiersClassNames={{ booked:'font-bold underline decoration-primary decoration-2 underline-offset-4' }} disabled={date => loading || !teacherId || dayInZone(date, timezone) < dayInZone(new Date(),timezone) || dayInZone(date,timezone) > dayInZone(new Date(Date.now()+89*86400000),timezone)} className="student-booking-date-picker w-full flex-1" />
        <p className="mt-4 text-center text-xs text-muted-foreground">Times are displayed in {timezone}. Availability updates when you book.</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">Underlined dates have booked classes.</p>
      </div>
      <div className="flex min-h-0 flex-col p-6">
        <h3 className="font-display text-xl font-bold">Available times</h3>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">{day ? dateInZone(day,timezone) : 'Choose a date'}</p>
        <div className="relative min-h-0 flex-1">
        <div className="grid max-h-80 content-start gap-2 overflow-y-auto sm:grid-cols-2 lg:absolute lg:inset-0 lg:max-h-none lg:grid-cols-1" role="group" aria-label="Available class times" tabIndex={0}>
          {slots.map(slot => <Button key={slot.starts_at} variant={selected?.starts_at===slot.starts_at?'default':'outline'} aria-pressed={selected?.starts_at===slot.starts_at} className="h-11 rounded-xl" onClick={() => setSelected(slot)}>{timeInZone(slot.starts_at,timezone)}</Button>)}
        </div>
        {!slots.length && <p className="py-6 text-sm text-muted-foreground">{loading ? 'Loading availability…' : 'No times available. Try another date, duration or teacher.'}</p>}
        </div>
        <div className="mt-auto pt-6">
        <Button className="h-11 w-full rounded-xl" disabled={!selected || !validDuration(duration) || busy || loading} onClick={() => {setDialogError('');setConfirming(true)}}>Continue</Button>
        {replacing && <Button variant="ghost" className="mt-2 w-full" disabled={busy} onClick={() => {setReplacing(null);setMessage('Rescheduling stopped. Your original booking is unchanged.')}}>Keep original booking</Button>}
        </div>
      </div>
    </section>

    <StudentAgenda bookings={data.bookings} teachers={data.teachers} timezone={timezone} busy={busy} loading={loading} focusBooking={focusBooking} onReschedule={reschedule} onCancel={booking=>{setDialogError('');setCancelling(booking)}} onBook={()=>{document.getElementById('booking-teacher')?.focus();document.getElementById('booking-page')?.scrollIntoView({behavior:'smooth'})}} />

    <CalendarDialog open={confirming} onClose={()=>setConfirming(false)} busy={busy} title={replacing?'Reschedule class':'Confirm your class'}>
      <form onSubmit={event=>{event.preventDefault();void book()}} className="space-y-4">
        <p className="font-bold">{teacher?.display_name} · {classType==='trial'?'Trial Class':'Regular Class'} · {duration} min</p>
        {selected && <p className="text-sm">{dateInZone(selected.starts_at,timezone)} · {timeInZone(selected.starts_at,timezone)} – {timeInZone(selected.ends_at,timezone)}</p>}
        <p className="text-sm text-muted-foreground">{provider==='zoom'?'Zoom':'Google Meet'} · {timezone}</p>
        <p className="text-sm">Credits required: {creditsRequired} · Available: {data.availableCredits ?? 'Not configured'}</p>
        <label className="block text-sm font-bold" htmlFor="class-topic">What would you like to work on? (optional)</label>
        <textarea id="class-topic" className={inputClass} maxLength={2000} value={topic} onChange={e=>setTopic(e.target.value)} />
        {dialogError && <p role="alert" className="text-sm text-destructive">{dialogError}</p>}
        <Button type="submit" disabled={busy||!selected} className="w-full">{busy?'Securing your time…':replacing?'Confirm new time':'Confirm booking'}</Button>
      </form>
    </CalendarDialog>
    <CalendarDialog open={!!cancelling} onClose={()=>setCancelling(null)} busy={busy} title="Cancel this class?">
      <p className="mb-4 text-sm text-muted-foreground">Your reserved time will become available for other students.</p>
      {dialogError && <p role="alert" className="mb-4 text-sm text-destructive">{dialogError}</p>}
      <div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={()=>setCancelling(null)}>Keep class</Button><Button disabled={busy} onClick={()=>void cancel()}>{busy?'Cancelling…':'Cancel class'}</Button></div>
    </CalendarDialog>
  </CalendarShell>
}
