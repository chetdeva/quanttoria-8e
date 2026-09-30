'use client'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { cn } from '@/lib/utils'

export function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames()
  return (
    <DayPicker
      showOutsideDays
      className={cn('booking-date-picker p-3', className)}
      classNames={{
        ...defaults,
        month_caption: cn(defaults.month_caption, 'font-bold'),
        chevron: cn(defaults.chevron, 'fill-primary'),
        day_button: cn(
          defaults.day_button,
          'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ),
        ...classNames,
      }}
      {...props}
    />
  )
}
