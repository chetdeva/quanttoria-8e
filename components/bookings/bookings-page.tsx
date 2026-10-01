'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, CalendarPlus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarDialog } from '@/components/ui/calendar-dialog'
import { BookingCard } from '@/components/bookings/booking-card'
import { BookingsStats } from '@/components/bookings/bookings-stats'
import { BookingsToolbar, type ViewMode } from '@/components/bookings/bookings-toolbar'
import { BookingsCalendarView } from '@/components/bookings/bookings-calendar-view'
import {
  cancelReasons,
  filterItems,
  studentItems,
  teacherItems,
  type BookingItem,
  type BookingRole,
  type RangePreset,
  type StatusFilter,
  type TeacherMeeting,
} from '@/lib/bookings'
import { calendarRequest, loadCalendar } from '@/lib/calendar/client'
import { createClient } from '@/lib/supabase/client'
import { createTeacherRepository } from '@/lib/calendar/teacher-repository'
import type { Session } from '@/lib/calendar/types'
import { dateInZone, timeInZone } from '@/lib/calendar/time'

type Props = { role: BookingRole; profileId: string; profileName: string | null; isAdminView: boolean }
type Raw = { items: (now: number) => BookingItem[] }

async function loadStudent(profileId: string): Promise<Raw> {
  const snapshot = await loadCalendar(profileId)
  return { items: now => studentItems(snapshot.bookings, snapshot.teachers, now) }
}

async function loadTeacher(profileId: string): Promise<Raw> {
  const repository = createTeacherRepository()
  const [slots, , enrolled] = await repository.load(profileId)
  if (slots.error || enrolled.error) throw new Error('Could not load your bookings. Please refresh to try again.')
  const sessions = (slots.data ?? []) as Session[]
  const students = Object.fromEntries(
    ((enrolled.data ?? []) as { session_id: string; student_name: string }[]).map(row => [row.session_id, row.student_name]),
  )
  const ids = sessions.filter(session => students[session.id]).map(session => session.id)
  const meetings: Record<string, TeacherMeeting> = {}
  if (ids.length) {
    const { data } = await createClient()
      .from('class_bookings')
      .select('session_id, meeting_url, topic, class_type, video_provider')
      .in('session_id', ids)
      .neq('status', 'cancelled')
    for (const row of (data ?? []) as TeacherMeeting[]) meetings[row.session_id] = row
  }
  return { items: now => teacherItems(sessions, students, meetings, now) }
}

export function BookingsPage({ role, profileId, profileName, isAdminView }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [timezone, setTimezone] = useState('UTC')
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<RangePreset>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [view, setView] = useState<ViewMode>('list')
  const [cancelling, setCancelling] = useState<BookingItem | null>(null)
  const [reason, setReason] = useState(cancelReasons[0])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['bookings', role, profileId],
    () => (role === 'student' ? loadStudent(profileId) : loadTeacher(profileId)),
    { revalidateOnFocus: true },
  )

  const items = useMemo(() => data?.items(now) ?? [], [data, now])
  const visible = useMemo(() => filterItems(items, { query, status, range, now }), [items, query, status, range, now])
  const counts = useMemo(() => {
    const base = filterItems(items, { query, status: 'all', range, now })
    return {
      all: base.length,
      upcoming: base.filter(item => item.status === 'upcoming').length,
      pending: base.filter(item => item.status === 'pending').length,
      completed: base.filter(item => item.status === 'completed').length,
      cancelled: base.filter(item => item.status === 'cancelled').length,
    } satisfies Record<StatusFilter, number>
  }, [items, query, range, now])

  const suffix = isAdminView ? `?userId=${encodeURIComponent(profileId)}` : ''
  const dashboardHref = `/${role}/dashboard${suffix}`
  const name = profileName?.trim().split(' ')[0] || (role === 'teacher' ? 'Teacher' : 'Student')

  async function confirmCancel() {
    if (!cancelling?.bookingId || busy) return
    setBusy(true)
    try {
      await calendarRequest(`/bookings/${cancelling.bookingId}${suffix}`, { method: 'DELETE' })
      setNotice('Booking cancelled.')
      setCancelling(null)
      await mutate()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not cancel this booking.')
      setCancelling(null)
    } finally {
      setBusy(false)
    }
  }

  async function complete(item: BookingItem) {
    if (busy) return
    setBusy(true)
    try {
      const result = await createTeacherRepository().changeStatus(profileId, item.sessionId, 'confirmed', 'completed')
      setNotice(result.error ? 'Could not mark this class complete.' : 'Class marked complete.')
      await mutate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 pt-5 sm:pt-0">
          <div>
            <Link href={dashboardHref} className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {role === 'teacher' ? 'Student bookings' : `${name}'s bookings`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === 'teacher' ? 'Everything your students have reserved with you.' : 'Manage your one-to-one maths sessions.'} · {timezone.replaceAll('_', ' ')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={isValidating} onClick={() => void mutate()}>
              <RefreshCw className={isValidating ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button nativeButton={false} render={<Link href={dashboardHref} />}>
              <CalendarPlus />
              {role === 'teacher' ? 'Set availability' : 'Book new session'}
            </Button>
          </div>
        </header>

        <BookingsStats items={items} role={role} now={now} />

        <BookingsToolbar
          query={query}
          onQuery={setQuery}
          range={range}
          onRange={setRange}
          status={status}
          onStatus={setStatus}
          view={view}
          onView={setView}
          counts={counts}
          searchLabel={role === 'teacher' ? 'Search by student, topic or booking ID' : 'Search by tutor, topic or booking ID'}
        />

        {notice && (
          <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Could not load bookings.'}
          </p>
        )}

        {view === 'calendar' ? (
          <BookingsCalendarView items={visible} timezone={timezone} />
        ) : (
          <section aria-label="Bookings" aria-busy={isLoading} className="space-y-3">
            {isLoading &&
              [0, 1, 2].map(key => <div key={key} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />)}
            {visible.map(item => (
              <BookingCard
                key={item.id}
                item={item}
                role={role}
                timezone={timezone}
                now={now}
                busy={busy}
                scheduleHref={dashboardHref}
                onCancel={target => {
                  setReason(cancelReasons[0])
                  setCancelling(target)
                }}
                onComplete={target => void complete(target)}
              />
            ))}
            {!isLoading && !visible.length && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <h2 className="font-display text-xl font-bold">No bookings found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length ? 'Try a different search, status or date range.' : role === 'teacher' ? 'Students will appear here once they book your open slots.' : 'Book your first session to get started.'}
                </p>
                {!items.length && (
                  <Button className="mt-4" nativeButton={false} render={<Link href={dashboardHref} />}>
                    {role === 'teacher' ? 'Set availability' : 'Book new session'}
                  </Button>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <CalendarDialog open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel this booking?" busy={busy}>
        {cancelling && (
          <div className="space-y-4">
            <p className="text-sm">
              {cancelling.subject} with <b>{cancelling.person}</b> on {dateInZone(cancelling.startsAt, timezone)} at {timeInZone(cancelling.startsAt, timezone)}.
            </p>
            <label className="block text-sm font-bold">
              Reason for cancelling
              <select
                value={reason}
                onChange={event => setReason(event.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm"
              >
                {cancelReasons.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Cancelling frees this time for other students. Please contact your tutor if you are cancelling close to the start time.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setCancelling(null)}>
                Keep booking
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => void confirmCancel()}>
                {busy ? 'Cancelling…' : 'Cancel booking'}
              </Button>
            </div>
          </div>
        )}
      </CalendarDialog>
    </main>
  )
}
