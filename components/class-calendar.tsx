'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, Plus, RefreshCw, Users, X, Globe2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Session = { id: string; teacher_id: string; title: string; starts_at: string; ends_at: string; status: string; topic: string | null; notes: string | null }
type Booking = { id: string; session_id: string; status: string; topic: string | null; notes: string | null; class_sessions?: Session }
type Availability = { id: string; day_of_week: number; start_time: string; end_time: string; timezone: string; is_active: boolean }

type Zone = { value: string; label: string; short: string }
const zones: Zone[] = [
  { value: 'America/New_York', label: 'Eastern Time', short: 'ET' },
  { value: 'America/Chicago', label: 'Central Time', short: 'CT' },
  { value: 'America/Denver', label: 'Mountain Time', short: 'MT' },
  { value: 'America/Phoenix', label: 'Arizona', short: 'AZ' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', short: 'PT' },
  { value: 'America/Anchorage', label: 'Alaska Time', short: 'AKT' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', short: 'HST' },
]
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const zoneName = (value: string) => zones.find((zone) => zone.value === value)
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
const formatInZone = (value: string, timezone: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { ...options, timeZone: timezone }).format(new Date(value))
const formatDate = (value: string, timezone: string) => formatInZone(value, timezone, { weekday: 'short', month: 'short', day: 'numeric' })
const formatTime = (value: string, timezone: string) => formatInZone(value, timezone, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

function TimezoneSelect({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) {
  return <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-input bg-background p-3 text-sm" aria-label="Time zone">
    {zones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label} ({zone.short})</option>)}
    {!zones.some((zone) => zone.value === value) && <option value={value}>{value}</option>}
    <option value="Other">Other timezone</option>
  </select>
}

export function StudentCalendar({ profileName }: { profileName: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const supabase = useMemo(() => createClient(), [])

  async function load() {
    setLoading(true)
    const { data: sessionsData } = await supabase.from('class_sessions').select('id, teacher_id, title, starts_at, ends_at, status, topic, notes').eq('status', 'open').gte('starts_at', new Date().toISOString()).order('starts_at')
    const { data: userData } = await supabase.auth.getUser()
    const { data: bookingsData } = userData.user ? await supabase.from('class_bookings').select('id, session_id, status, topic, notes, class_sessions(id, teacher_id, title, starts_at, ends_at, status, topic, notes)').eq('student_id', userData.user.id).order('created_at', { ascending: false }) : { data: [] }
    setSessions((sessionsData ?? []) as Session[])
    setBookings((bookingsData ?? []) as unknown as Booking[])
    setLoading(false)
  }
  useEffect(() => { setTimezone(browserZone()); void load() }, [])

  async function book() {
    if (!selected) return
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const { error } = await supabase.from('class_bookings').insert({ session_id: selected.id, student_id: userData.user.id, topic: topic.trim() || null })
    if (error) setMessage(error.code === '23505' ? 'That slot was just booked. Choose another time.' : 'We could not book that class. Please try again.')
    else { setMessage('Class booked. Your tutor is ready for you.'); setSelected(null); setTopic(''); await load() }
  }
  async function cancel(booking: Booking) { const { error } = await supabase.from('class_bookings').update({ status: 'cancelled' }).eq('id', booking.id); if (!error) await load() }
  const currentZone = zoneName(timezone)

  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Student space</p><h1 className="mt-2 font-display text-4xl font-extrabold">Your learning calendar, {profileName.split(' ')[0]}</h1><p className="mt-2 text-muted-foreground">Pick a time that works for you and make it count.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw data-icon="inline-start" />Refresh</Button></header>
    <div className="mt-8 grid gap-5 md:grid-cols-3"><Stat label="Class credits" value="8" tone="bg-accent" /><Stat label="Upcoming classes" value={String(bookings.filter((b) => b.status === 'confirmed').length)} tone="bg-mint" /><div className="rounded-3xl border border-border bg-card p-5"><label htmlFor="student-timezone" className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><Globe2 data-icon="inline-start" />Times shown in</label><TimezoneSelect id="student-timezone" value={timezone} onChange={setTimezone} /><p className="mt-2 text-xs text-muted-foreground">Change this anytime to refresh slot times.</p></div></div>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-extrabold">Open class times</h2><p className="text-sm text-muted-foreground">All times are shown in {currentZone?.label ?? timezone} ({currentZone?.short ?? 'local'}).</p></div><CalendarDays className="text-primary" /></div>{loading ? <p className="py-12 text-center text-muted-foreground">Loading available classes...</p> : sessions.length === 0 ? <div className="py-12 text-center"><CalendarDays className="mx-auto text-muted-foreground" /><p className="mt-3 font-bold">No open times yet</p><p className="mt-1 text-sm text-muted-foreground">Your teacher will publish the next available class here.</p></div> : <div className="mt-5 grid gap-3">{sessions.map((session) => <button key={session.id} type="button" onClick={() => setSelected(session)} className="flex items-center justify-between rounded-2xl border border-border p-4 text-left transition hover:border-primary hover:bg-secondary"><span><span className="block font-bold">{formatDate(session.starts_at, timezone)}</span><span className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 />{formatTime(session.starts_at, timezone)} – {formatTime(session.ends_at, timezone)} · {session.title}</span></span><span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-foreground">Book</span></button>)}</div>}</div>
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-extrabold">Your classes</h2><p className="text-sm text-muted-foreground">Keep your momentum going.</p></div><Users className="text-coral" /></div><div className="mt-5 flex flex-col gap-3">{bookings.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Booked classes will appear here.</p> : bookings.map((booking) => <div key={booking.id} className="rounded-2xl bg-secondary p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{booking.class_sessions?.title ?? 'Class'}</p><p className="mt-1 text-sm text-muted-foreground">{booking.class_sessions ? `${formatDate(booking.class_sessions.starts_at, timezone)} · ${formatTime(booking.class_sessions.starts_at, timezone)}` : ''}</p></div><span className="text-xs font-bold uppercase text-mint-foreground">{booking.status}</span></div>{booking.status === 'confirmed' && <Button className="mt-3 w-full" variant="outline" size="sm" onClick={() => void cancel(booking)}>Cancel class</Button>}</div>)}</div></div></section>
    {message && <p role="status" className="mt-5 rounded-xl bg-mint p-3 text-sm font-bold text-mint-foreground">{message}</p>}
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-extrabold">Confirm your class</h2><button type="button" aria-label="Close" onClick={() => setSelected(null)}><X /></button></div><p className="mt-4 rounded-2xl bg-secondary p-4 font-bold">{formatDate(selected.starts_at, timezone)} · {formatTime(selected.starts_at, timezone)} – {formatTime(selected.ends_at, timezone)}<span className="mt-1 block text-sm font-normal text-muted-foreground">{selected.title}</span></p><label className="mt-5 block text-sm font-bold" htmlFor="topic">What would you like to work on?</label><textarea id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Optional topic or note" /><Button className="mt-5 w-full" onClick={() => void book()}><Check data-icon="inline-start" />Confirm booking</Button></div></div>}
  </div></main>
}

export function TeacherCalendar({ profileName }: { profileName: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [title, setTitle] = useState('Maths breakthrough session')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [day, setDay] = useState('1')
  const [from, setFrom] = useState('09:00')
  const [to, setTo] = useState('17:00')
  const [timezone, setTimezone] = useState(browserZone())
  const [message, setMessage] = useState('')
  const supabase = useMemo(() => createClient(), [])
  async function load() { const { data: user } = await supabase.auth.getUser(); if (!user.user) return; const [{ data: s }, { data: a }] = await Promise.all([supabase.from('class_sessions').select('id, teacher_id, title, starts_at, ends_at, status, topic, notes').eq('teacher_id', user.user.id).order('starts_at'), supabase.from('teacher_availability').select('id, day_of_week, start_time, end_time, timezone, is_active').eq('teacher_id', user.user.id).order('day_of_week')]); setSessions((s ?? []) as Session[]); setAvailability((a ?? []) as Availability[]) }
  useEffect(() => { void load() }, [])
  async function addSession() { const { data: user } = await supabase.auth.getUser(); if (!user.user || !start || !end) return; const { error } = await supabase.from('class_sessions').insert({ teacher_id: user.user.id, title, starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(), status: 'open' }); setMessage(error ? 'Could not publish that class. Check the time and try again.' : `Class published in ${zoneName(timezone)?.label ?? timezone}. Students will see it in their own timezone.`); if (!error) await load() }
  async function saveAvailability() { const { data: user } = await supabase.auth.getUser(); if (!user.user) return; const { error } = await supabase.from('teacher_availability').upsert({ teacher_id: user.user.id, day_of_week: Number(day), start_time: from, end_time: to, timezone, is_active: true }); setMessage(error ? 'Could not save availability.' : `Weekly availability saved in ${zoneName(timezone)?.label ?? timezone}.`); if (!error) await load() }
  async function updateStatus(id: string, status: string) { await supabase.from('class_sessions').update({ status }).eq('id', id); await load() }
  const currentZone = zoneName(timezone)
  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Teacher workspace</p><h1 className="mt-2 font-display text-4xl font-extrabold">Shape the week, {profileName.split(' ')[0]}</h1><p className="mt-2 text-muted-foreground">Publish times, keep your rhythm, and see every learner in one place.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw data-icon="inline-start" />Refresh</Button></header><div className="mt-8 grid gap-5 lg:grid-cols-2"><Panel title="Weekly availability"><div className="flex flex-col gap-3"><label className="text-sm font-bold text-muted-foreground" htmlFor="teacher-timezone">All availability is in this timezone</label><TimezoneSelect id="teacher-timezone" value={timezone} onChange={setTimezone} /><div className="grid gap-3 sm:grid-cols-4"><select value={day} onChange={(e) => setDay(e.target.value)} className="rounded-xl border border-input bg-background p-3 text-sm"><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option></select><input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-input bg-background p-3 text-sm" /><input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-input bg-background p-3 text-sm" /><Button onClick={() => void saveAvailability()}>Save hours</Button></div></div><div className="mt-4 flex flex-wrap gap-2">{availability.map((item) => <span key={item.id} className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-foreground">{dayNames[item.day_of_week]} {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {zoneName(item.timezone)?.short ?? item.timezone}</span>)}</div></Panel><Panel title="Publish a class"><div className="flex flex-col gap-3"><label className="text-sm font-bold text-muted-foreground">Start and end are interpreted in {currentZone?.label ?? timezone} ({currentZone?.short ?? 'local'})</label><input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Class title" className="rounded-xl border border-input bg-background p-3 text-sm" /><div className="grid gap-3 sm:grid-cols-2"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Class start" className="rounded-xl border border-input bg-background p-3 text-sm" /><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Class end" className="rounded-xl border border-input bg-background p-3 text-sm" /></div><Button onClick={() => void addSession()}><Plus data-icon="inline-start" />Publish class</Button></div></Panel></div><Panel title="Published classes"><div className="mt-4 flex flex-col gap-3">{sessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary p-4"><div><p className="font-bold">{session.title}</p><p className="text-sm text-muted-foreground">{formatDate(session.starts_at, timezone)} · {formatTime(session.starts_at, timezone)} – {formatTime(session.ends_at, timezone)}</p></div><Button variant="outline" size="sm" onClick={() => void updateStatus(session.id, session.status === 'open' ? 'cancelled' : 'open')}>{session.status === 'open' ? 'Close slot' : 'Reopen slot'}</Button></div>)}</div></Panel>{message && <p role="status" className="mt-5 rounded-xl bg-mint p-3 text-sm font-bold text-mint-foreground">{message}</p>}</div></main>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><h2 className="font-display text-2xl font-extrabold">{title}</h2><div className="mt-4">{children}</div></section> }
function Stat({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className={`rounded-3xl border border-border ${tone} p-5`}><p className="text-sm font-bold text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-extrabold">{value}</p></div> }
