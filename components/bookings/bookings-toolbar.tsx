'use client'

import { Dialog, DialogTrigger, Popover } from 'react-aria-components'
import { CalendarDays, ChevronDown, LayoutList, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RangePreset, StatusFilter } from '@/lib/bookings'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'calendar'

const ranges: { value: RangePreset; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
]

const tabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Pending Confirmation' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type Props = {
  query: string
  onQuery: (value: string) => void
  range: RangePreset
  onRange: (value: RangePreset) => void
  status: StatusFilter
  onStatus: (value: StatusFilter) => void
  view: ViewMode
  onView: (value: ViewMode) => void
  counts: Record<StatusFilter, number>
  searchLabel: string
}

export function BookingsToolbar({ query, onQuery, range, onRange, status, onStatus, view, onView, counts, searchLabel }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="booking-search"
            type="search"
            value={query}
            onChange={event => onQuery(event.target.value)}
            placeholder={searchLabel}
            className="h-11 w-full rounded-xl border border-input bg-card pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <DialogTrigger>
          <Button variant="outline" className="h-11 rounded-xl px-4">
            <CalendarDays />
            {ranges.find(item => item.value === range)?.label}
            <ChevronDown />
          </Button>
          <Popover placement="bottom end" className="z-50 w-52 rounded-xl border border-border bg-card p-1.5 text-foreground shadow-xl">
            <Dialog aria-label="Date range" className="outline-none">
              {({ close }) => (
                <div role="group" aria-label="Date range presets" className="flex flex-col">
                  {ranges.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={range === item.value}
                      onClick={() => {
                        onRange(item.value)
                        close()
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted',
                        range === item.value && 'bg-sky font-bold text-primary',
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </Dialog>
          </Popover>
        </DialogTrigger>

        <div role="group" aria-label="View mode" className="flex rounded-xl border border-border bg-card p-1">
          {([
            ['list', 'List', LayoutList],
            ['calendar', 'Calendar', CalendarDays],
          ] as const).map(([value, label, Icon]) => (
            <Button
              key={value}
              size="sm"
              variant={view === value ? 'default' : 'ghost'}
              aria-pressed={view === value}
              className="h-9 flex-1 rounded-lg px-3"
              onClick={() => onView(value)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Filter by status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={status === tab.value}
            onClick={() => onStatus(tab.value)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring',
              status === tab.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs',
                status === tab.value ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
              )}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
