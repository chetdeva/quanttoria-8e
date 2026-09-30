'use client'

import { useMemo } from 'react'
import { Check, Circle, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIMEZONE_OPTIONS, hourLabel, zonedParts } from './timezone'
import type { GridSession } from './types'

const HOUR_HEIGHT = 64
const START_HOUR = 8
const END_HOUR = 20
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const DOT_TONES = ['bg-primary', 'bg-coral', 'bg-accent', 'bg-mint'] as const

type PlacedChip = {
  key: string
  top: number
  height: number
  title: string
  timeLabel: string
  kind: 'available' | 'booked'
  onClick?: () => void
}

export function WeeklyCalendarGrid({
  availableSessions,
  bookedSessions,
  onSelectSlot,
  timezone,
  onTimezoneChange,
}: {
  availableSessions: GridSession[]
  bookedSessions: GridSession[]
  onSelectSlot: (session: GridSession) => void
  timezone: string
  onTimezoneChange: (value: string) => void
}) {
  const effectiveZone = timezone === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone

  const days = useMemo(() => {
    const now = Date.now()
    return Array.from({ length: 7 }, (_, i) => {
      const instant = new Date(now + i * 86400000)
      return zonedParts(instant, effectiveZone)
    })
  }, [effectiveZone])

  function place(session: GridSession, kind: 'available' | 'booked', onClick?: () => void): { dayIndex: number; chip: PlacedChip } | null {
    const startParts = zonedParts(new Date(session.starts_at), effectiveZone)
    const endParts = zonedParts(new Date(session.ends_at), effectiveZone)
    const dayIndex = days.findIndex((d) => d.dateKey === startParts.dateKey)
    if (dayIndex === -1) return null
    const startOffset = startParts.hour + startParts.minute / 60 - START_HOUR
    const endOffset = endParts.hour + endParts.minute / 60 - START_HOUR
    const clampedStart = Math.max(startOffset, 0)
    const clampedEnd = Math.min(endOffset, END_HOUR - START_HOUR)
    if (clampedEnd <= clampedStart) return null
    const top = clampedStart * HOUR_HEIGHT
    const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 36)
    const timeLabel = `${hourLabel(startParts.hour)}${startParts.minute ? `:${String(startParts.minute).padStart(2, '0')}` : ''}`
    return {
      dayIndex,
      chip: { key: session.id, top, height, title: session.title, timeLabel, kind, onClick },
    }
  }

  const chipsByDay: PlacedChip[][] = days.map(() => [])
  for (const session of availableSessions) {
    const placed = place(session, 'available', () => onSelectSlot(session))
    if (placed) chipsByDay[placed.dayIndex].push(placed.chip)
  }
  for (const session of bookedSessions) {
    const placed = place(session, 'booked')
    if (placed) chipsByDay[placed.dayIndex].push(placed.chip)
  }

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT

  const todayKey = days[0]?.dateKey

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Circle className="size-5 fill-current" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold">Open class times</h2>
            <p className="text-sm text-muted-foreground">Tap a highlighted slot to book your class.</p>
          </div>
        </div>
        <Select value={timezone} onValueChange={(value) => value && onTimezoneChange(value)}>
          <SelectTrigger className="w-auto gap-2 rounded-full border-input bg-secondary text-sm font-bold">
            <Globe className="size-4 text-primary" aria-hidden="true" />
            <span className="sr-only">Timezone</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto p-5 sm:p-7">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-x-1.5">
            <div />
            {days.map((day, index) => {
              const isToday = day.dateKey === todayKey
              return (
                <div
                  key={index}
                  className={`rounded-2xl px-2 py-2.5 text-center transition ${
                    isToday ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary'
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      isToday ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {day.weekday}
                  </p>
                  <p className="font-display text-sm font-extrabold">{day.monthDay}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-2 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-x-1.5">
            <div className="relative" style={{ height: gridHeight }}>
              {HOURS.map((hour, index) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-xs font-bold text-muted-foreground"
                  style={{ top: index * HOUR_HEIGHT }}
                >
                  {hourLabel(hour)}
                </span>
              ))}
            </div>

            {days.map((day, dayIndex) => {
              const isToday = day.dateKey === todayKey
              return (
                <div
                  key={dayIndex}
                  className={`relative rounded-2xl border transition ${
                    isToday ? 'border-primary/30 bg-primary/5' : 'border-border/70 bg-background'
                  }`}
                  style={{ height: gridHeight }}
                >
                  {HOURS.slice(0, -1).map((hour, index) => (
                    <div key={hour} className="absolute inset-x-0 border-t border-border/40" style={{ top: (index + 1) * HOUR_HEIGHT }} />
                  ))}
                  {chipsByDay[dayIndex].map((chip, chipIndex) =>
                    chip.kind === 'available' ? (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={chip.onClick}
                        className="group absolute inset-x-1 flex flex-col justify-center overflow-hidden rounded-xl border border-mint/60 bg-mint/25 py-1.5 pl-3 pr-2 text-left text-xs font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-mint hover:bg-mint/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        style={{ top: chip.top, height: chip.height }}
                      >
                        <span
                          className={`absolute inset-y-0 left-0 w-1 ${DOT_TONES[chipIndex % DOT_TONES.length]}`}
                          aria-hidden="true"
                        />
                        <span className="block leading-tight text-mint-foreground">{chip.timeLabel}</span>
                        <span className="block truncate font-normal leading-tight text-muted-foreground">{chip.title}</span>
                      </button>
                    ) : (
                      <div
                        key={chip.key}
                        className="absolute inset-x-1 flex flex-col justify-center overflow-hidden rounded-xl bg-primary py-1.5 pl-3 pr-2 text-xs font-bold text-primary-foreground shadow-md"
                        style={{ top: chip.top, height: chip.height }}
                      >
                        <span className="absolute inset-y-0 left-0 w-1 bg-primary-foreground/40" aria-hidden="true" />
                        <span className="flex items-center gap-1 leading-tight">
                          <Check className="size-3" aria-hidden="true" />
                          Booked
                        </span>
                        <span className="block truncate font-normal leading-tight opacity-90">{chip.title}</span>
                      </div>
                    ),
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
