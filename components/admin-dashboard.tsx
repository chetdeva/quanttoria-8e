'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Command,
  Download,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const tabs = ['Overview & Metrics', 'Student Dashboards', 'Teacher Dashboards', 'Live Bookings & Logs']

type Status = 'confirmed' | 'pending' | 'cancelled' | 'conflict'

type Booking = {
  id: string
  student: string
  teacher: string
  initials: string
  subject: string
  time: string
  startsAt: string
  status: Status
}

type DashboardProps = {
  currentUser: { full_name: string | null; email: string | null }
  profiles: Array<{ id: string; full_name: string | null; email: string | null; role: string }>
  sessions: Array<{ id: string; teacher_id: string; title: string; starts_at: string; ends_at: string; status: string; topic: string | null }>
  bookings: Array<{ id: string; session_id: string; student_id: string; status: string; topic: string | null; created_at: string; class_sessions: DashboardProps['sessions'][number] | null }>
}

function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function downloadReport(bookings: Booking[]) {
  const csv = ['Booking,Student,Teacher,Subject,Time,Status', ...bookings.map((booking) => [booking.id, booking.student, booking.teacher, booking.subject, booking.time, booking.status].map((value) => `"${value.replaceAll('"', '""')}"`).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `quanttoria-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function createDashboardData({ profiles, bookings }: Pick<DashboardProps, 'profiles' | 'bookings'>) {
  const byId = new Map(profiles.map((profile) => [profile.id, profile]))
  const rows: Booking[] = bookings.map((booking) => {
    const session = booking.class_sessions
    const student = byId.get(booking.student_id)
    const teacher = session ? byId.get(session.teacher_id) : null
    return {
      id: booking.id.slice(0, 8).toUpperCase(), student: student?.full_name ?? 'Unknown student', teacher: teacher?.full_name ?? 'Unassigned',
      initials: initials(student?.full_name ?? 'Student'), subject: booking.topic ?? session?.topic ?? session?.title ?? 'Maths session',
      time: session ? formatBookingTime(session.starts_at) : formatBookingTime(booking.created_at), startsAt: session?.starts_at ?? booking.created_at, status: booking.status === 'completed' ? 'confirmed' : booking.status as Status,
    }
  })
  const students = profiles.filter((profile) => profile.role === 'student').map((profile) => ({ name: profile.full_name ?? 'Unnamed student', email: profile.email ?? '', teacher: 'Not assigned', bookings: bookings.filter((booking) => booking.student_id === profile.id).length, credits: '—', status: 'Active', initials: initials(profile.full_name ?? 'Student') }))
  const teachers = profiles.filter((profile) => profile.role === 'teacher').map((profile) => ({ name: profile.full_name ?? 'Unnamed teacher', email: profile.email ?? '', specialty: 'Maths tutor', sync: 'Synced', pending: bookings.filter((booking) => booking.class_sessions?.teacher_id === profile.id && booking.status === 'confirmed').length, initials: initials(profile.full_name ?? 'Teacher') }))
  return { bookings: rows, students, teachers }
}

function Avatar({ initials, tone = 'blue' }: { initials: string; tone?: 'blue' | 'yellow' | 'mint' | 'coral' }) {
  return <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${tone === 'yellow' ? 'bg-accent text-accent-foreground' : tone === 'mint' ? 'bg-mint text-mint-foreground' : tone === 'coral' ? 'bg-coral/20 text-coral' : 'bg-primary/10 text-primary'}`}>{initials}</div>
}

function StatusBadge({ status }: { status: Status }) {
  const styles = { confirmed: 'bg-mint/60 text-mint-foreground', pending: 'bg-accent text-accent-foreground', cancelled: 'bg-muted text-muted-foreground', conflict: 'bg-coral/15 text-coral' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${styles[status]}`}>{status === 'confirmed' && <Check className="size-3" />}{status === 'conflict' && <AlertTriangle className="size-3" />}{status}</span>
}

export default function AdminDashboard({ currentUser, profiles, sessions, bookings: rawBookings }: DashboardProps) {
  const { bookings, students, teachers } = createDashboardData({ profiles, bookings: rawBookings })
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [query, setQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notice, setNotice] = useState('')
  const [panel, setPanel] = useState<'notifications' | 'profile' | 'settings' | 'quick-actions' | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const filteredBookings = useMemo(() => bookings.filter((booking) => `${booking.student} ${booking.teacher} ${booking.id}`.toLowerCase().includes(query.toLowerCase())), [query])
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2200) }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-border/70 bg-white transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-border/70 px-6">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
          <div><p className="font-display text-lg font-bold leading-none">Quanttoria</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin workspace</p></div>
        </div>
        <div className="px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
          <nav className="mt-3 flex flex-col gap-1" aria-label="Primary navigation">
            {[['Overview', LayoutDashboard], ['Students', GraduationCap], ['Teachers', Users], ['Bookings & Logs', Activity]].map(([label, Icon]) => <button key={label as string} onClick={() => setActiveTab(label === 'Students' ? tabs[1] : label === 'Teachers' ? tabs[2] : label === 'Bookings & Logs' ? tabs[3] : tabs[0])} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${((label === 'Overview' && activeTab === tabs[0]) || (label === 'Students' && activeTab === tabs[1]) || (label === 'Teachers' && activeTab === tabs[2]) || (label === 'Bookings & Logs' && activeTab === tabs[3])) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-[18px]" />{label as string}</button>)}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-2xl bg-[#f1f5ff] p-4"><div className="flex items-center gap-2 text-xs font-bold text-primary"><ShieldCheck className="size-4" />System healthy</div><p className="mt-2 text-xs leading-5 text-muted-foreground">All services are operating normally.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full w-[98%] rounded-full bg-primary" /></div></div>
          <button onClick={() => setPanel('settings')} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"><Settings2 className="size-[18px]" />Workspace settings</button>
          <button onClick={async () => { setIsSigningOut(true); await createClient().auth.signOut(); window.location.href = '/' }} disabled={isSigningOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60"><LogOut className="size-[18px]" />{isSigningOut ? 'Signing out…' : 'Log out'}</button>
        </div>
      </aside>
      <main className={`min-h-screen transition-[margin] ${sidebarOpen ? 'ml-[248px]' : 'ml-0'}`}>
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/70 bg-white/90 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4"><Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft /></Button><div className="relative hidden w-[300px] md:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students, teachers, bookings" className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-14 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /><kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-white px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘ K</kbd></div></div>
          <div className="flex items-center gap-3"><div className="hidden items-center gap-5 text-xs font-semibold text-muted-foreground lg:flex"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-mint-foreground" />Active bookings <strong className="text-foreground">{rawBookings.length}</strong></span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-coral" />Failed syncs <strong className="text-foreground">0</strong></span></div><Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setPanel('notifications')}><Bell /></Button><button onClick={() => setPanel('profile')} className="flex items-center gap-2 border-l border-border pl-3 text-left"><Avatar initials={initials(currentUser.full_name ?? 'Administrator')} tone="yellow" /><div className="hidden sm:block"><p className="text-xs font-bold">{currentUser.full_name ?? 'Administrator'}</p><p className="text-[10px] text-muted-foreground">Administrator</p></div><ChevronDown className="size-4 text-muted-foreground" /></button></div>
        </header>
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date())}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Good morning, {currentUser.full_name ?? 'Administrator'}.</h1><p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your learning network.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { downloadReport(bookings); showNotice('Report downloaded') }}><Download data-icon="inline-start" />Export report</Button><Button onClick={() => setPanel('quick-actions')}><Zap data-icon="inline-start" />Quick action</Button></div></div>
          <div className="mt-8 flex items-center gap-1 overflow-x-auto border-b border-border/70">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-bold transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab}</button>)}</div>
          {activeTab === tabs[0] && <Overview filteredBookings={filteredBookings} onSelect={setSelectedBooking} showNotice={showNotice} teachersCount={teachers.length} studentsCount={students.length} />}
          {activeTab === tabs[1] && <ManagementTable title="Students" subtitle="Manage learner accounts, credits, and teacher assignments." rows={students} query={query} setQuery={setQuery} type="student" onAction={showNotice} />}
          {activeTab === tabs[2] && <ManagementTable title="Teachers" subtitle="Review tutor availability and calendar connections." rows={teachers} query={query} setQuery={setQuery} type="teacher" onAction={showNotice} />}
          {activeTab === tabs[3] && <BookingsTable rows={filteredBookings} onSelect={setSelectedBooking} onAction={showNotice} />}
        </div>
      </main>
      {panel && <div className="fixed inset-0 z-40 flex items-start justify-end bg-foreground/10 p-4 pt-20 backdrop-blur-[2px]" onClick={() => setPanel(null)}><section className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Admin workspace</p><h2 className="mt-2 font-display text-2xl font-bold">{panel === 'notifications' ? 'Notifications' : panel === 'profile' ? 'Your profile' : panel === 'settings' ? 'Workspace settings' : 'Quick actions'}</h2></div><Button variant="ghost" size="icon" onClick={() => setPanel(null)} aria-label="Close panel"><X /></Button></div>
        {panel === 'notifications' && <div className="mt-6 flex flex-col gap-3"><div className="rounded-xl bg-muted/60 p-4"><p className="text-sm font-bold">All systems are healthy</p><p className="mt-1 text-xs text-muted-foreground">No new service alerts.</p></div><div className="rounded-xl bg-accent/40 p-4"><p className="text-sm font-bold">Booking activity synced</p><p className="mt-1 text-xs text-muted-foreground">Your latest booking data is up to date.</p></div></div>}
        {panel === 'profile' && <div className="mt-6 flex flex-col gap-4"><div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4"><Avatar initials={initials(currentUser.full_name ?? 'Administrator')} tone="yellow" /><div><p className="font-bold">{currentUser.full_name ?? 'Administrator'}</p><p className="text-xs text-muted-foreground">{currentUser.email ?? 'No email available'}</p></div></div><Button variant="outline" className="w-full" onClick={() => showNotice('Profile editing is coming soon')}>Edit profile</Button></div>}
        {panel === 'settings' && <div className="mt-6 flex flex-col gap-4"><div className="rounded-xl border border-border p-4"><p className="text-sm font-bold">Workspace preferences</p><p className="mt-1 text-xs text-muted-foreground">Manage notifications, calendar sync, and admin access.</p></div><Button className="w-full" onClick={() => showNotice('Workspace settings saved')}>Save settings</Button></div>}
        {panel === 'quick-actions' && <div className="mt-6 flex flex-col gap-2"><Button variant="outline" className="justify-start" onClick={() => { setPanel(null); setActiveTab(tabs[1]) }}><GraduationCap data-icon="inline-start" />Review students</Button><Button variant="outline" className="justify-start" onClick={() => { setPanel(null); setActiveTab(tabs[2]) }}><Users data-icon="inline-start" />Review teachers</Button><Button variant="outline" className="justify-start" onClick={() => { setPanel(null); setActiveTab(tabs[3]) }}><CalendarDays data-icon="inline-start" />Review bookings</Button><Button variant="outline" className="justify-start" onClick={() => { downloadReport(bookings); setPanel(null); showNotice('Report downloaded') }}><Download data-icon="inline-start" />Download report</Button></div>}
      </section></div>}
      {selectedBooking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}><div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Booking lifecycle</p><h2 className="mt-2 font-display text-2xl font-bold">{selectedBooking.id}</h2></div><Button variant="ghost" size="icon" onClick={() => setSelectedBooking(null)} aria-label="Close booking details"><X /></Button></div><div className="mt-6 flex items-center gap-3 rounded-xl bg-muted/60 p-4"><Avatar initials={selectedBooking.initials} /><div className="flex-1"><p className="font-bold">{selectedBooking.student}</p><p className="text-xs text-muted-foreground">{selectedBooking.subject} with {selectedBooking.teacher}</p></div><StatusBadge status={selectedBooking.status} /></div><div className="mt-6 flex flex-col gap-4">{[['Booking created', 'Today, 10:24 AM', 'done'], ['Teacher calendar checked', 'Today, 10:25 AM', 'done'], ['Confirmation sent', selectedBooking.status === 'pending' ? 'Waiting for approval' : 'Today, 10:26 AM', selectedBooking.status === 'pending' ? 'wait' : 'done']].map(([label, time, state]) => <div key={label} className="flex items-center gap-3 text-sm"><div className={`flex size-7 items-center justify-center rounded-full ${state === 'done' ? 'bg-mint text-mint-foreground' : 'bg-accent text-accent-foreground'}`}>{state === 'done' ? <Check className="size-4" /> : <Clock3 className="size-4" />}</div><div><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{time}</p></div></div>)}</div><div className="mt-7 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button><Button onClick={() => { showNotice('Booking status updated'); setSelectedBooking(null) }}>Update status</Button></div></div></div>}
      {notice && <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl"><CircleCheck className="size-4 text-mint" />{notice}</div>}
    </div>
  )
}

function Overview({ filteredBookings, onSelect, showNotice, teachersCount, studentsCount }: { filteredBookings: Booking[]; onSelect: (booking: Booking) => void; showNotice: (message: string) => void; teachersCount: number; studentsCount: number }) {
  const today = new Date().toDateString()
  const todayBookings = filteredBookings.filter((booking) => new Date(booking.startsAt).toDateString() === today).length
  const upcomingBookings = filteredBookings.filter((booking) => booking.status === 'confirmed' || booking.status === 'pending').length
  const completedBookings = filteredBookings.filter((booking) => booking.status === 'confirmed').length
  const successRate = filteredBookings.length ? `${Math.round((completedBookings / filteredBookings.length) * 100)}%` : '—'
  const cards = [{ label: 'Active teachers', value: String(teachersCount), trend: 'From live profiles', icon: Users, tone: 'blue' }, { label: 'Active students', value: String(studentsCount), trend: 'From live profiles', icon: GraduationCap, tone: 'yellow' }, { label: "Today's bookings", value: String(todayBookings), trend: `${upcomingBookings} upcoming`, icon: CalendarDays, tone: 'mint' }, { label: 'Success rate', value: successRate, trend: 'Based on booking status', icon: BarChart3, tone: 'coral' }]
  return <div className="mt-7 flex flex-col gap-7"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, trend, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-border/70 bg-white p-5 shadow-[0_2px_12px_rgba(28,42,80,0.03)]"><div className="flex items-center justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${tone === 'yellow' ? 'bg-accent' : tone === 'mint' ? 'bg-mint/60' : tone === 'coral' ? 'bg-coral/15' : 'bg-primary/10'}`}><Icon className={`size-[18px] ${tone === 'yellow' ? 'text-accent-foreground' : tone === 'mint' ? 'text-mint-foreground' : tone === 'coral' ? 'text-coral' : 'text-primary'}`} /></span><ArrowUpRight className="size-4 text-muted-foreground" /></div><p className="mt-5 text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold">{value}</p><p className="mt-1 text-[11px] font-semibold text-mint-foreground">{trend}</p></div>)}</div><div className="grid gap-7 xl:grid-cols-[1.55fr_1fr]"><section className="rounded-2xl border border-border/70 bg-white"><div className="flex items-center justify-between border-b border-border/70 px-6 py-5"><div><h2 className="font-display text-lg font-bold">Recent booking activity</h2><p className="mt-1 text-xs text-muted-foreground">Live updates from your tutoring network</p></div><Button variant="ghost" size="sm" onClick={() => showNotice('Showing all bookings')}><span>View all</span><ArrowUpRight data-icon="inline-end" /></Button></div><div className="divide-y divide-border/60">{filteredBookings.slice(0, 5).map((booking) => <button key={booking.id} onClick={() => onSelect(booking)} className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"><Avatar initials={booking.initials} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{booking.student}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{booking.subject} with {booking.teacher}</p></div><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{booking.time}</p><p className="mt-1 text-[11px] text-muted-foreground">{booking.id}</p></div><StatusBadge status={booking.status} /></button>)}</div></section><section className="rounded-2xl border border-border/70 bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="font-display text-lg font-bold">Today&apos;s pulse</h2><p className="mt-1 text-xs text-muted-foreground">Booking health at a glance</p></div><Activity className="size-5 text-primary" /></div><div className="mt-7 flex items-center gap-7"><div className="relative flex size-32 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#4f63d9 0 76%, #f4d45d 76% 94%, #f1e9ef 94% 100%)' }}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-white"><span className="font-display text-2xl font-bold">96%</span><span className="text-[10px] text-muted-foreground">healthy</span></div></div><div className="flex flex-1 flex-col gap-3 text-xs font-semibold"><span className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />Confirmed</span><strong>24</strong></span><span className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-accent" />Pending</span><strong>6</strong></span><span className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-muted" />Conflicts</span><strong>2</strong></span></div></div><div className="mt-7 rounded-xl bg-[#fff9df] p-3 text-xs leading-5 text-accent-foreground"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4" />Two conflicts need review</div><p className="mt-1 text-accent-foreground/70">Both are scheduled for tomorrow afternoon.</p></div></section></div></div>
}

function ManagementTable({ title, subtitle, rows, query, setQuery, type, onAction }: { title: string; subtitle: string; rows: any[]; query: string; setQuery: (value: string) => void; type: 'student' | 'teacher'; onAction: (message: string) => void }) {
  const filtered = rows.filter((row) => `${row.name} ${row.email} ${row.specialty ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="mt-7 rounded-2xl border border-border/70 bg-white"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 p-6"><div><h2 className="font-display text-xl font-bold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${title.toLowerCase()}`} className="h-9 w-[210px] rounded-lg border border-border pl-9 text-xs outline-none focus:border-primary" /></div><Button variant="outline" size="icon" aria-label="Filter"><Filter /></Button></div></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-border/70 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><th className="px-6 py-3">{type === 'student' ? 'Student' : 'Teacher'}</th><th className="px-4 py-3">{type === 'student' ? 'Enrolled teacher' : 'Specialty'}</th><th className="px-4 py-3">{type === 'student' ? 'Bookings' : 'Pending requests'}</th><th className="px-4 py-3">{type === 'student' ? 'Credits / status' : 'Calendar sync'}</th><th className="px-6 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border/60">{filtered.map((row, index) => <tr key={row.name} className="text-sm"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar initials={row.initials} tone={index % 2 ? 'yellow' : 'blue'} /><div><p className="font-bold">{row.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.email}</p></div></div></td><td className="px-4 py-4 text-xs font-semibold">{type === 'student' ? row.teacher : row.specialty}</td><td className="px-4 py-4 text-xs font-semibold">{type === 'student' ? row.bookings : row.pending}</td><td className="px-4 py-4">{type === 'student' ? <div><p className="text-xs font-bold">{row.credits}</p><span className={`text-[11px] font-semibold ${row.status === 'Active' ? 'text-mint-foreground' : 'text-coral'}`}>{row.status}</span></div> : <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${row.sync === 'Synced' ? 'bg-mint/60 text-mint-foreground' : 'bg-coral/15 text-coral'}`}>{row.sync === 'Synced' ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}{row.sync}</span>}</td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => onAction(`Inspecting ${row.name}`)}>Inspect <ArrowUpRight data-icon="inline-end" /></Button></td></tr>)}</tbody></table></div></div>
}

function BookingsTable({ rows, onSelect, onAction }: { rows: Booking[]; onSelect: (booking: Booking) => void; onAction: (message: string) => void }) {
  return <div className="mt-7 rounded-2xl border border-border/70 bg-white"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 p-6"><div><h2 className="font-display text-xl font-bold">Live bookings & verification</h2><p className="mt-1 text-xs text-muted-foreground">Audit every booking lifecycle and resolve conflicts.</p></div><Button variant="outline" onClick={() => onAction('Audit log exported')}><Download data-icon="inline-start" />Export audit log</Button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-border/70 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><th className="px-6 py-3">Booking</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Slot timestamp</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border/60">{rows.map((booking) => <tr key={booking.id} className="text-sm"><td className="px-6 py-4 font-bold text-primary">{booking.id}</td><td className="px-4 py-4 font-semibold">{booking.student}</td><td className="px-4 py-4 text-xs text-muted-foreground">{booking.teacher}</td><td className="px-4 py-4 text-xs font-semibold">{booking.time}</td><td className="px-4 py-4"><StatusBadge status={booking.status} /></td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => onSelect(booking)}>Inspect <ArrowUpRight data-icon="inline-end" /></Button><Button variant="ghost" size="icon-sm" aria-label={`More actions for ${booking.id}`} onClick={() => onAction(`${booking.id} actions opened`)}><MoreHorizontal /></Button></td></tr>)}</tbody></table></div></div>
}
