'use client'

import { useId, useState } from 'react'
import { Clock3 } from 'lucide-react'

export function CalendarDuration({ value, onChange, max = 180, disabled = false, className = '' }: {
  value: number
  onChange: (minutes: number) => void
  max?: number
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const [custom, setCustom] = useState(false)
  const isCustom = custom || (value !== 30 && value !== 60)
  const valid = Number.isInteger(value) && value >= 15 && value <= max && value % 15 === 0
  return <fieldset disabled={disabled} className={className}>
    <legend className="mb-2 flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4" aria-hidden="true" />Duration</legend>
    <div className="flex flex-wrap gap-3">
      {[30,60].map(minutes => <label key={minutes} className="flex items-center gap-2 text-sm">
        <input type="radio" name={`${id}-duration`} value={minutes} checked={!isCustom && value === minutes}
          onChange={()=>{setCustom(false);onChange(minutes)}} className="accent-primary" />{minutes} min
      </label>)}
      <label className="flex items-center gap-2 text-sm"><input type="radio" name={`${id}-duration`} checked={isCustom} onChange={()=>setCustom(true)} className="accent-primary" />Custom</label>
    </div>
    {isCustom && <div className="mt-3">
      <label htmlFor={`${id}-minutes`} className="mb-2 block text-sm">Duration in minutes</label>
      <input id={`${id}-minutes`} type="number" min={15} max={max} step={15} required value={value || ''}
        onChange={event=>onChange(Number(event.target.value))} aria-describedby={`${id}-help`} aria-invalid={!valid}
        className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">15–{max} minutes, in 15-minute steps.</p>
    </div>}
  </fieldset>
}
