'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminViewBanner, EventCard, Panel } from './shared'
import type { Availability, Session } from './types'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))

export function TeacherCalendar({
  profileName,
  profileId,
  isAdminView = false,
}: {
  profileName: string
  profileId: string
  isAdminView?: boolean
}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [title, setTitle] = useState('Maths breakthrough session')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [day, setDay] = useState('1')
  const [from, setFrom] = useState('09:00')
  const [to, setTo] = useState('17:00')
  const [message, setMessage] = useState('')
  const supabase = useMemo(() => createClient(), [])

  async function load() {
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase
        .from('class_sessions')
        .select('id, teacher_id, title, starts_at, ends_at, status, topic, notes')
        .eq('teacher_id', profileId)
        .order('starts_at'),
      supabase
        .from('teacher_availability')
        .select('id, day_of_week, start_time, end_time, timezone, is_active')
        .eq('teacher_id', profileId)
        .order('day_of_week'),
    ])
    setSessions((s ?? []) as Session[])
    setAvailability((a ?? []) as Availability[])
  }

  useEffect(() => {
    void load()
  }, [])

  async function addSession() {
    if (!start || !end) return
    const { error } = await supabase
      .from('class_sessions')
      .insert({ teacher_id: profileId, title, starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(), status: 'open' })
    setMessage(error ? 'Could not publish that class. Check the time and try again.' : 'Class time published for students.')
    if (!error) await load()
  }

  async function saveAvailability() {
    const { error } = await supabase
      .from('teacher_availability')
      .upsert({ teacher_id: profileId, day_of_week: Number(day), start_time: from, end_time: to, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, is_active: true })
    setMessage(error ? 'Could not save availability.' : 'Weekly availability saved.')
    if (!error) await load()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('class_sessions').update({ status }).eq('id', id)
    await load()
  }

  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {isAdminView && <AdminViewBanner role="teacher" profileName={profileName} />}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Teacher workspace</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold">Shape the week, {profileName.split(' ')[0]}</h1>
            <p className="mt-2 text-muted-foreground">Publish times, keep your rhythm, and see every learner in one place.</p>
          </div>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        </header>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Panel title="Weekly availability">
            <div className="grid gap-3 sm:grid-cols-4">
              <Select value={day} onValueChange={(value) => value && setDay(value)}>
                <SelectTrigger className="rounded-xl border-input bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-input bg-background p-3 text-sm"
                aria-label="Start time"
              />
              <input
                type="time"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-input bg-background p-3 text-sm"
                aria-label="End time"
              />
              <Button onClick={() => void saveAvailability()}>Save hours</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {availability.map((item) => (
                <span key={item.id} className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-foreground">
                  {dayNames[item.day_of_week]} {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title="Publish a class">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Class title"
                className="rounded-xl border border-input bg-background p-3 text-sm sm:col-span-3"
              />
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label="Start date and time"
                className="rounded-xl border border-input bg-background p-3 text-sm"
              />
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-label="End date and time"
                className="rounded-xl border border-input bg-background p-3 text-sm"
              />
              <Button onClick={() => void addSession()}>Publish</Button>
            </div>
          </Panel>
        </div>
        <Panel title="Your published classes">
          <div className="flex flex-col gap-3">
            {sessions.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">Classes you publish will appear here.</p>
            ) : (
              sessions.map((session) => (
                <EventCard
                  key={session.id}
                  accent={session.status === 'open' ? 'mint' : session.status === 'booked' ? 'primary' : 'muted'}
                  title={session.title}
                  meta={`${formatDate(session.starts_at)} · ${formatTime(session.starts_at)} – ${formatTime(session.ends_at)}`}
                  badge={session.status}
                >
                  {session.status === 'open' && (
                    <Button className="mt-3" variant="outline" size="sm" onClick={() => void updateStatus(session.id, 'cancelled')}>
                      Cancel
                    </Button>
                  )}
                </EventCard>
              ))
            )}
          </div>
        </Panel>
        {message && (
          <p role="status" className="mt-5 rounded-xl bg-mint p-3 text-sm font-bold text-mint-foreground">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
