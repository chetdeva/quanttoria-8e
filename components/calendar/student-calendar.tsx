'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { WeeklyCalendarGrid } from './weekly-calendar-grid'
import { BookingDialog } from './booking-dialog'
import { AdminViewBanner, EventCard, Stat } from './shared'
import type { Booking, GridSession, Session } from './types'

const STARTING_CREDITS = 8

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))

export function StudentCalendar({
  profileName,
  profileId,
  isAdminView = false,
}: {
  profileName: string
  profileId: string
  isAdminView?: boolean
}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [calendarTimezone, setCalendarTimezone] = useState('auto')
  const [credits, setCredits] = useState(STARTING_CREDITS)
  const [creditPulse, setCreditPulse] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function load() {
    setLoading(true)
    const { data: sessionsData } = await supabase
      .from('class_sessions')
      .select('id, teacher_id, title, starts_at, ends_at, status, topic, notes')
      .eq('status', 'open')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
    const { data: bookingsData } = await supabase
      .from('class_bookings')
      .select('id, session_id, status, topic, notes, class_sessions(id, teacher_id, title, starts_at, ends_at, status, topic, notes)')
      .eq('student_id', profileId)
      .order('created_at', { ascending: false })
    setSessions((sessionsData ?? []) as Session[])
    setBookings((bookingsData ?? []) as unknown as Booking[])
    setLoading(false)
  }

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    void load()
  }, [])

  async function book() {
    if (!selected) return
    setMessage('')
    const bookedSession = selected
    const { error } = await supabase
      .from('class_bookings')
      .insert({ session_id: bookedSession.id, student_id: profileId, topic: topic.trim() || null })
    if (error) {
      setMessage(error.code === '23505' ? 'That slot was just booked. Choose another time.' : 'We could not book that class. Please try again.')
    } else {
      setMessage('Class booked. Your tutor is ready for you.')
      setSelected(null)
      setTopic('')
      setSessions((prev) => prev.filter((s) => s.id !== bookedSession.id))
      setBookings((prev) => [
        { id: `optimistic-${bookedSession.id}`, session_id: bookedSession.id, status: 'confirmed', topic: null, notes: null, class_sessions: bookedSession },
        ...prev,
      ])
      setCredits((prev) => Math.max(prev - 1, 0))
      setCreditPulse(true)
      setTimeout(() => setCreditPulse(false), 500)
      await load()
    }
  }

  async function cancel(booking: Booking) {
    const { error } = await supabase.from('class_bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    if (!error) await load()
  }

  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {isAdminView && <AdminViewBanner role="student" profileName={profileName} />}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Student space</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold">Your learning calendar, {profileName.split(' ')[0]}</h1>
            <p className="mt-2 text-muted-foreground">Pick a time that works for you and make it count.</p>
          </div>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        </header>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className={`rounded-3xl border border-border bg-accent p-5 ${creditPulse ? 'animate-credit-pulse' : ''}`}>
            <p className="text-sm font-bold text-muted-foreground">Class credits</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{credits}</p>
          </div>
          <Stat label="Upcoming classes" value={String(bookings.filter((b) => b.status === 'confirmed').length)} tone="bg-mint" />
          <Stat label="Your timezone" value={timezone} tone="bg-card" />
        </div>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <WeeklyCalendarGrid
            availableSessions={sessions}
            bookedSessions={bookings.filter((b) => b.status === 'confirmed' && b.class_sessions).map((b) => b.class_sessions as GridSession)}
            onSelectSlot={(session) => setSelected(sessions.find((s) => s.id === session.id) ?? null)}
            timezone={calendarTimezone}
            onTimezoneChange={setCalendarTimezone}
          />
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold">Your classes</h2>
                <p className="text-sm text-muted-foreground">Keep your momentum going.</p>
              </div>
              <Users className="text-coral" />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {bookings.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">Booked classes will appear here.</p>
              ) : (
                bookings.map((booking) => (
                  <EventCard
                    key={booking.id}
                    accent={booking.status === 'confirmed' ? 'mint' : 'muted'}
                    title={booking.class_sessions?.title ?? 'Class'}
                    meta={booking.class_sessions ? `${formatDate(booking.class_sessions.starts_at)} · ${formatTime(booking.class_sessions.starts_at)}` : ''}
                    badge={booking.status}
                  >
                    {booking.status === 'confirmed' && (
                      <Button className="mt-3 w-full" variant="outline" size="sm" onClick={() => void cancel(booking)}>
                        Cancel class
                      </Button>
                    )}
                  </EventCard>
                ))
              )}
            </div>
          </div>
        </section>
        {loading && <p className="mt-4 text-center text-muted-foreground">Loading available classes...</p>}
        {!loading && sessions.length === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">No open times right now. Your teacher will publish the next available class here.</p>
        )}
        {message && (
          <p role="status" className="mt-5 rounded-xl bg-mint p-3 text-sm font-bold text-mint-foreground">
            {message}
          </p>
        )}
        <BookingDialog session={selected} topic={topic} onTopicChange={setTopic} onClose={() => setSelected(null)} onConfirm={() => void book()} />
      </div>
    </main>
  )
}
