'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDialog } from '@/components/ui/calendar-dialog'
import {
  CalendarShell,
  dateKey,
  formatDate,
  formatTime,
  sessionFields,
  type Booking,
  type CalendarProps,
  type Session,
} from '@/components/calendar-shared'

export function StudentCalendar(props: CalendarProps) {
  const { profileId } = props
  const supabase = useMemo(() => createClient(), [])
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [day, setDay] = useState<Date>()
  const [month, setMonth] = useState<Date>()
  const [selected, setSelected] = useState<Session | null>(null)
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [topic, setTopic] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogError, setDialogError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [slots, classes] = await Promise.all([
        supabase
          .from('class_sessions')
          .select(sessionFields)
          .eq('status', 'open')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at'),
        supabase
          .from('class_bookings')
          .select(
            `id, session_id, status, topic, notes, class_sessions(${sessionFields})`,
          )
          .eq('student_id', profileId)
          .order('created_at', { ascending: false }),
      ])
      if (slots.error || classes.error) {
        setMessage('Could not load the calendar. Please refresh to try again.')
        return
      }
      const normalized = (classes.data ?? []).map((booking) => ({
        ...booking,
        class_sessions: Array.isArray(booking.class_sessions)
          ? (booking.class_sessions[0] ?? null)
          : booking.class_sessions,
      })) as Booking[]
      const bookedIds = new Set(
        normalized
          .filter((booking) => booking.status !== 'cancelled')
          .map((booking) => booking.session_id),
      )
      const available = ((slots.data ?? []) as Session[]).filter(
        (slot) => !bookedIds.has(slot.id),
      )
      setSessions(available)
      setBookings(normalized)
      setDay(
        (current) => current ?? new Date(available[0]?.starts_at ?? Date.now()),
      )
      setMonth(
        (current) => current ?? new Date(available[0]?.starts_at ?? Date.now()),
      )
    } catch {
      setMessage('Could not connect to the calendar. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    void load()
  }, [load])
  const slots = sessions.filter(
    (session) => day && dateKey(session.starts_at) === dateKey(day),
  )
  const upcoming = bookings.filter(
    (booking) =>
      booking.status === 'confirmed' &&
      booking.class_sessions &&
      new Date(booking.class_sessions.starts_at) > new Date(),
  )

  async function book() {
    if (!selected || busy) return
    setBusy(true)
    setDialogError('')
    try {
      if (new Date(selected.starts_at) <= new Date()) {
        setDialogError('This time has passed. Choose another slot.')
        return
      }
      const { error } = await supabase.from('class_bookings').insert({
        session_id: selected.id,
        student_id: profileId,
        topic: topic.trim() || null,
      })
      if (error) {
        setDialogError(
          error.code === '23505'
            ? 'That time is no longer available. Choose another slot.'
            : 'Could not book this class. Please try again.',
        )
        await load()
        return
      }
      setSelected(null)
      setTopic('')
      setMessage('Your class is booked. You can find it under Your classes.')
      await load()
    } catch {
      setDialogError('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  async function cancel() {
    if (!cancelling || busy) return
    setBusy(true)
    setDialogError('')
    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelling.id)
        .eq('student_id', profileId)
        .select('id')
      if (error || !data?.length) {
        setDialogError('Could not cancel this class. Please try again.')
        return
      }
      setCancelling(null)
      setMessage('Your class has been cancelled.')
      await load()
    } catch {
      setDialogError('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <CalendarShell
      {...props}
      role="student"
      timezone={timezone}
      loading={loading}
      onRefresh={() => void load()}
    >
      <section
        aria-labelledby="booking-heading"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 id="booking-heading" className="text-lg font-bold">
            Book a class
          </h2>
          <span className="text-xs text-muted-foreground">
            {sessions.length} available times
          </span>
        </div>
        <div className="grid md:grid-cols-[330px_1fr]">
          <div className="border-b border-border p-4 md:border-r md:border-b-0">
            <Calendar
              mode="single"
              required
              selected={day}
              onSelect={setDay}
              month={month}
              onMonthChange={setMonth}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              modifiers={{
                available: sessions.map(
                  (session) => new Date(session.starts_at),
                ),
              }}
              modifiersClassNames={{ available: 'calendar-day-available' }}
            />
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Dates with available classes
            </p>
          </div>
          <div className="min-h-80 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Available times
            </p>
            <h3 className="mt-2 text-xl font-bold">
              {day ? formatDate(day) : 'Choose a date'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All times in {timezone || 'your local timezone'}
            </p>
            {loading ? (
              <p className="py-12 text-sm text-muted-foreground" role="status">
                Loading available times…
              </p>
            ) : slots.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    className="h-auto min-h-20 flex-col items-start gap-1 whitespace-normal rounded-xl p-4 text-left hover:border-primary hover:bg-secondary"
                    onClick={() => {
                      setSelected(slot)
                      setTopic('')
                      setDialogError('')
                    }}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <Clock3 className="size-4 text-primary" />
                      {formatTime(slot.starts_at)}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {Math.round(
                        (+new Date(slot.ends_at) - +new Date(slot.starts_at)) /
                          60000,
                      )}{' '}
                      min · {slot.title}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
                <CalendarDays className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 font-bold">
                  No available times on this date
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a marked date or check back when your teacher publishes
                  new times.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-border bg-card p-4 text-sm"
        >
          {message}
        </p>
      )}
      <section
        className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
        aria-labelledby="classes-heading"
      >
        <div className="flex items-center justify-between">
          <h2 id="classes-heading" className="text-lg font-bold">
            Your classes
          </h2>
          <span className="text-xs text-muted-foreground">
            {upcoming.length} upcoming
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bookings.length ? (
            bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">
                    {booking.class_sessions?.title ?? 'Class'}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase">
                    {booking.status}
                  </span>
                </div>
                {booking.class_sessions && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(booking.class_sessions.starts_at)} ·{' '}
                    {formatTime(booking.class_sessions.starts_at)}
                  </p>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="mt-3 text-destructive"
                    onClick={() => {
                      setCancelling(booking)
                      setDialogError('')
                    }}
                  >
                    Cancel class
                  </Button>
                )}
              </article>
            ))
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              Your booked classes will appear here.
            </p>
          )}
        </div>
      </section>
      <CalendarDialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Confirm your class"
        busy={busy}
      >
        {selected && (
          <>
            <p className="rounded-xl bg-secondary p-4 text-sm">
              <strong>{selected.title}</strong>
              <span className="mt-2 block">
                {formatDate(selected.starts_at)} ·{' '}
                {formatTime(selected.starts_at)}–{formatTime(selected.ends_at)}
              </span>
              <span className="mt-1 block text-muted-foreground">
                {timezone}
              </span>
            </p>
            <label
              htmlFor="booking-topic"
              className="mt-5 block text-sm font-bold"
            >
              What would you like to work on?
            </label>
            <textarea
              id="booking-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              maxLength={2000}
              rows={3}
              className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm"
              placeholder="Optional topic or note"
              disabled={busy}
            />
            {dialogError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {dialogError}
              </p>
            )}
            <Button
              disabled={busy}
              onClick={() => void book()}
              className="mt-5 w-full"
            >
              <Check />
              {busy ? 'Booking…' : 'Confirm booking'}
            </Button>
          </>
        )}
      </CalendarDialog>
      <CalendarDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel this class?"
        busy={busy}
      >
        <p className="text-sm text-muted-foreground">
          This will cancel your booking for{' '}
          {cancelling?.class_sessions
            ? formatDate(cancelling.class_sessions.starts_at)
            : 'this class'}
          .
        </p>
        {dialogError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {dialogError}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setCancelling(null)}
          >
            Keep booking
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void cancel()}
          >
            {busy ? 'Cancelling…' : 'Cancel class'}
          </Button>
        </div>
      </CalendarDialog>
    </CalendarShell>
  )
}
