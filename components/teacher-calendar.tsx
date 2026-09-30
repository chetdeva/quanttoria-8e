'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventApi } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDialog } from '@/components/ui/calendar-dialog'
import {
  CalendarShell,
  dateKey,
  formatDate,
  formatTime,
  localInput,
  sessionFields,
  type Availability,
  type CalendarProps,
  type Session,
} from '@/components/calendar-shared'

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
type Draft = {
  id?: string
  title: string
  start: string
  end: string
  weekly: boolean
  status: string
}
const inputClass =
  'mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function TeacherCalendar(props: CalendarProps) {
  const { profileId } = props
  const supabase = useMemo(() => createClient(), [])
  const calendar = useRef<FullCalendar>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [heading, setHeading] = useState('Your schedule')
  const [view, setView] = useState('timeGridWeek')
  const [date, setDate] = useState<Date>()
  const [month, setMonth] = useState<Date>()
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [slots, hours] = await Promise.all([
        supabase
          .from('class_sessions')
          .select(sessionFields)
          .eq('teacher_id', profileId)
          .order('starts_at'),
        supabase
          .from('teacher_availability')
          .select('id, day_of_week, start_time, end_time, timezone, is_active')
          .eq('teacher_id', profileId)
          .order('day_of_week'),
      ])
      if (slots.error || hours.error) {
        setMessage('Could not load your schedule. Please refresh to try again.')
        return
      }
      setSessions((slots.data ?? []) as Session[])
      setAvailability((hours.data ?? []) as Availability[])
    } catch {
      setMessage('Could not connect to your schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const today = new Date()
    setDate(today)
    setMonth(today)
    if (window.innerWidth < 768) {
      calendar.current?.getApi().changeView('timeGridDay')
      setView('timeGridDay')
    }
    void load()
  }, [load])

  function createDraft(start: Date, end: Date) {
    setDialogError('')
    setDraft({
      title: 'Maths breakthrough session',
      start: localInput(start),
      end: localInput(end),
      weekly: false,
      status: 'open',
    })
  }

  function validRange(
    start: Date,
    end: Date,
    ignoreId?: string,
    weekly = false,
  ) {
    if (Number.isNaN(+start) || Number.isNaN(+end) || end <= start)
      return 'Choose an end time after the start time.'
    if (start <= new Date()) return 'Choose a time in the future.'
    if (
      !weekly &&
      sessions.some(
        (session) =>
          session.id !== ignoreId &&
          !['cancelled', 'completed'].includes(session.status) &&
          start < new Date(session.ends_at) &&
          end > new Date(session.starts_at),
      )
    )
      return 'This time overlaps another class. Choose a free time.'
    return ''
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft || busy) return
    const start = new Date(draft.start)
    const end = new Date(draft.end)
    const validation = validRange(start, end, draft.id, draft.weekly)
    if (validation) {
      setDialogError(validation)
      return
    }
    if (!draft.title.trim() && !draft.weekly) {
      setDialogError('Add a class title.')
      return
    }
    if (draft.weekly && dateKey(start) !== dateKey(end)) {
      setDialogError('Weekly hours must start and finish on the same day.')
      return
    }
    setBusy(true)
    setDialogError('')
    try {
      if (draft.weekly) {
        const existing = availability.find(
          (item) =>
            item.day_of_week === start.getDay() && item.timezone === timezone,
        )
        const values = {
          teacher_id: profileId,
          day_of_week: start.getDay(),
          start_time: draft.start.slice(11),
          end_time: draft.end.slice(11),
          timezone,
          is_active: true,
        }
        const result = existing
          ? await supabase
              .from('teacher_availability')
              .update(values)
              .eq('id', existing.id)
              .eq('teacher_id', profileId)
              .select('id')
          : await supabase
              .from('teacher_availability')
              .insert(values)
              .select('id')
        if (result.error || !result.data?.length) {
          setDialogError('Could not save weekly hours. Please try again.')
          return
        }
        setMessage(
          'Weekly availability saved. Publish individual class slots so students can book them.',
        )
      } else {
        const values = {
          title: draft.title.trim(),
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
        }
        const result = draft.id
          ? await supabase
              .from('class_sessions')
              .update(values)
              .eq('id', draft.id)
              .eq('teacher_id', profileId)
              .eq('status', 'open')
              .select('id')
          : await supabase
              .from('class_sessions')
              .insert({
                ...values,
                teacher_id: profileId,
                timezone,
                status: 'open',
              })
              .select('id')
        if (result.error || !result.data?.length) {
          setDialogError(
            'Could not save this slot. It may have been booked. Refresh and try again.',
          )
          return
        }
        setMessage(
          draft.id
            ? 'Class time updated.'
            : 'Class slot published for students.',
        )
      }
      setDraft(null)
      calendar.current?.getApi().unselect()
      await load()
    } catch {
      setDialogError('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function move(event: EventApi, revert: () => void) {
    const start = event.start
    const end = event.end
    if (!start || !end || busy) {
      revert()
      return
    }
    const validation = validRange(start, end, event.id)
    if (validation) {
      revert()
      setMessage(validation)
      return
    }
    setBusy(true)
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .update({ starts_at: start.toISOString(), ends_at: end.toISOString() })
        .eq('id', event.id)
        .eq('teacher_id', profileId)
        .eq('status', 'open')
        .select('id')
      if (error || !data?.length) {
        revert()
        setMessage('Could not update this slot. It may have been booked.')
        await load()
        return
      }
      setMessage('Class time updated.')
      await load()
    } catch {
      revert()
      setMessage('Could not save the new time. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(status: string) {
    if (!draft?.id || busy) return
    if (status === 'open') {
      const validation = validRange(
        new Date(draft.start),
        new Date(draft.end),
        draft.id,
      )
      if (validation) {
        setDialogError(validation)
        return
      }
    }
    setBusy(true)
    setDialogError('')
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .update({ status })
        .eq('id', draft.id)
        .eq('teacher_id', profileId)
        .eq('status', draft.status)
        .select('id')
      if (error || !data?.length) {
        setDialogError(
          'Could not update this class. Please refresh and try again.',
        )
        return
      }
      setDraft(null)
      setMessage(`Class marked ${status}.`)
      await load()
    } catch {
      setDialogError('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const events = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    start: session.starts_at,
    end: session.ends_at,
    editable:
      !busy &&
      session.status === 'open' &&
      new Date(session.starts_at) > new Date(),
    classNames: [`schedule-event-${session.status}`],
    extendedProps: { status: session.status },
  }))
  const recurringHours = availability
    .filter((item) => item.is_active && item.timezone === timezone)
    .map((item) => ({
      id: `availability-${item.id}`,
      daysOfWeek: [item.day_of_week],
      startTime: item.start_time,
      endTime: item.end_time,
      display: 'background',
      classNames: ['schedule-availability'],
      editable: false,
    }))
  const readOnly = !!draft?.id && draft.status !== 'open'

  return (
    <CalendarShell
      {...props}
      role="teacher"
      timezone={timezone}
      loading={loading}
      onRefresh={() => void load()}
    >
      <section
        className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[320px_1fr]"
        aria-label="Teacher schedule"
      >
        <aside className="border-b border-border p-4 lg:border-r lg:border-b-0">
          <Button
            disabled={loading || busy}
            className="mb-4 h-11 w-full rounded-xl"
            onClick={() => {
              const start = new Date()
              start.setHours(start.getHours() + 1, 0, 0, 0)
              createDraft(start, new Date(+start + 3600000))
            }}
          >
            <Plus />
            Create class slot
          </Button>
          <div className="hidden lg:block">
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={(value) => {
                if (value) {
                  setDate(value)
                  calendar.current?.getApi().gotoDate(value)
                }
              }}
            />
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="text-sm font-bold">Weekly availability</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Drag a range in the grid and choose “Repeat every week” to set
              working hours.
            </p>
            <div className="mt-3 space-y-2">
              {availability
                .filter((item) => item.is_active)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-mint/30 p-2 text-xs"
                  >
                    <p className="font-bold">
                      {days[item.day_of_week]} · {item.start_time.slice(0, 5)}–
                      {item.end_time.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {item.timezone}
                      {item.timezone !== timezone &&
                        ' · shown in original timezone'}
                    </p>
                  </div>
                ))}
              {!availability.some((item) => item.is_active) && (
                <p className="text-xs text-muted-foreground">
                  No weekly hours set yet.
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-primary" />
              Open
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-mint" />
              Confirmed
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-muted-foreground" />
              Blocked
            </span>
          </div>
        </aside>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Previous period"
                onClick={() => calendar.current?.getApi().prev()}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Next period"
                onClick={() => calendar.current?.getApi().next()}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                className="mx-1"
                onClick={() => calendar.current?.getApi().today()}
              >
                Today
              </Button>
              <h2 className="ml-2 text-sm font-bold sm:text-lg">{heading}</h2>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              View
              <select
                aria-label="Calendar view"
                value={view}
                onChange={(event) => {
                  setView(event.target.value)
                  calendar.current?.getApi().changeView(event.target.value)
                }}
                className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
              >
                <option value="timeGridWeek">Week</option>
                <option value="timeGridDay">Day</option>
                <option value="dayGridMonth">Month</option>
              </select>
            </label>
          </div>
          <p className="px-4 py-3 text-xs text-muted-foreground">
            Drag to select a time. Move or resize open slots. Click a class to
            see details.
          </p>
          <div
            className="schedule-matrix overflow-x-auto px-2 pb-3 sm:px-4"
            aria-busy={loading || busy}
          >
            <FullCalendar
              ref={calendar}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              height={680}
              timeZone="local"
              firstDay={1}
              allDaySlot={false}
              nowIndicator
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              scrollTime="08:00:00"
              selectable={!busy && !loading}
              selectMirror
              editable={!busy}
              eventResizableFromStart
              eventInteractive
              events={[...events, ...recurringHours]}
              dayMaxEvents={3}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short',
              }}
              datesSet={(info) => {
                setHeading(info.view.title)
                setView(info.view.type)
                setDate(info.view.calendar.getDate())
                setMonth(info.view.calendar.getDate())
              }}
              select={(info) => {
                if (info.allDay) {
                  const start = new Date(info.start)
                  start.setHours(9)
                  createDraft(start, new Date(+start + 3600000))
                } else createDraft(info.start, info.end)
              }}
              eventDrop={(info) => void move(info.event, info.revert)}
              eventResize={(info) => void move(info.event, info.revert)}
              eventClick={(info) => {
                const session = sessions.find(
                  (item) => item.id === info.event.id,
                )
                if (session) {
                  setDialogError('')
                  setDraft({
                    id: session.id,
                    title: session.title,
                    start: localInput(new Date(session.starts_at)),
                    end: localInput(new Date(session.ends_at)),
                    weekly: false,
                    status: session.status,
                  })
                }
              }}
              eventContent={(info) => (
                <div className="overflow-hidden px-1 py-0.5">
                  <p className="truncate text-[10px] font-semibold">
                    {info.timeText}
                  </p>
                  <p className="truncate text-xs font-bold">
                    {info.event.title}
                  </p>
                  {info.view.type !== 'dayGridMonth' && (
                    <p className="truncate text-[10px] capitalize">
                      {info.event.extendedProps.status}
                    </p>
                  )}
                </div>
              )}
            />
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
      <CalendarDialog
        open={!!draft}
        onClose={() => {
          setDraft(null)
          calendar.current?.getApi().unselect()
        }}
        title={draft?.id ? 'Class details' : 'Create availability'}
        busy={busy}
      >
        {draft && (
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {timezone} · {draft.status}
            </p>
            <label className="block text-sm font-bold">
              Class title
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                maxLength={200}
                required={!draft.weekly}
                disabled={busy || readOnly}
                className={inputClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Starts
                <input
                  type="datetime-local"
                  value={draft.start}
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                  required
                  disabled={busy || readOnly}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-bold">
                Ends
                <input
                  type="datetime-local"
                  value={draft.end}
                  onChange={(event) =>
                    setDraft({ ...draft, end: event.target.value })
                  }
                  required
                  disabled={busy || readOnly}
                  className={inputClass}
                />
              </label>
            </div>
            {!draft.id && (
              <label className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.weekly}
                  onChange={(event) =>
                    setDraft({ ...draft, weekly: event.target.checked })
                  }
                  disabled={busy}
                />
                Repeat every week as working hours
              </label>
            )}
            {draft.weekly && (
              <p className="text-xs text-muted-foreground">
                Updates weekly hours for this weekday in {timezone}. Working
                hours guide your schedule; publish class slots separately.
              </p>
            )}
            {readOnly && (
              <p className="text-sm text-muted-foreground">
                {formatDate(draft.start)} · {formatTime(draft.start)}–
                {formatTime(draft.end)}
              </p>
            )}
            {dialogError && (
              <p role="alert" className="text-sm text-destructive">
                {dialogError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {!readOnly && (
                <Button type="submit" disabled={busy}>
                  {busy
                    ? 'Saving…'
                    : draft.weekly
                      ? 'Save weekly hours'
                      : draft.id
                        ? 'Save changes'
                        : 'Publish slot'}
                </Button>
              )}
              {draft.id && draft.status === 'open' && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void changeStatus('blocked')}
                >
                  Block slot
                </Button>
              )}
              {draft.id && draft.status === 'blocked' && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('open')}
                >
                  Reopen slot
                </Button>
              )}
              {draft.id && draft.status === 'confirmed' && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('completed')}
                >
                  Mark completed
                </Button>
              )}
            </div>
          </form>
        )}
      </CalendarDialog>
    </CalendarShell>
  )
}
