'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Check, Clock3 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { whatsappLink } from '@/lib/site'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const timeZones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
]
const timeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

export function DemoCalendar({ onSubmitted }: { onSubmitted: () => void }) {
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState('')
  const [month, setMonth] = useState(new Date())
  const today = useMemo(() => new Date(), [])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!date || !time) return
    const data = new FormData(event.currentTarget)
    const formattedDate = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const message = `Hi Princy! I'd like to book a free demo lecture.\n\nParent: ${data.get('parent')}\nChild: ${data.get('child')}\nGrade: ${data.get('grade')}\nPhone: ${data.get('phone')}\nTime zone: ${data.get('timeZone')}\nPreferred time: ${formattedDate} at ${time}`
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
    onSubmitted()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parent/Guardian name" name="parent" placeholder="Your name" />
        <Field label="Child's name" name="child" placeholder="Their name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Child's grade" name="grade" placeholder="Select grade" options={grades} />
        <Field label="WhatsApp number" name="phone" placeholder="Your number" type="tel" />
      </div>
      <SelectField label="Your time zone" name="timeZone" placeholder="Select time zone" options={timeZones.map((zone) => zone.label)} values={timeZones.map((zone) => zone.value)} />

      <div className="rounded-2xl border border-border bg-secondary/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary p-2 text-primary-foreground"><CalendarDays className="size-5" aria-hidden="true" /></span>
          <div><h3 className="font-display text-lg font-extrabold">Choose a convenient time</h3><p className="text-sm text-muted-foreground">All times are shown in your selected time zone.</p></div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl bg-card p-2 ring-1 ring-border">
            <Calendar mode="single" selected={date} onSelect={(nextDate) => { setDate(nextDate); setTime('') }} month={month} onMonthChange={setMonth} disabled={{ before: today }} className="mx-auto" />
          </div>
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-primary" aria-hidden="true" />{date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Select a date'}</div><div className="grid grid-cols-2 gap-2">{timeSlots.map((slot) => <button key={slot} type="button" disabled={!date} onClick={() => setTime(slot)} className={`rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${time === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary disabled:cursor-not-allowed disabled:opacity-50'}`}>{slot}</button>)}</div></div>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={!date || !time} className="h-12 rounded-full text-base font-bold"><WhatsAppIcon className="size-5" />Request my free demo<Check data-icon="inline-end" /></Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">We'll only use these details to coordinate your demo lesson.</p>
    </form>
  )
}

function Field({ label, name, placeholder, type = 'text' }: { label: string; name: string; placeholder: string; type?: string }) {
  return <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`demo-${name}`}>{label}<input id={`demo-${name}`} name={name} type={type} required placeholder={placeholder} className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary" /></label>
}

function SelectField({ label, name, placeholder, options, values = options }: { label: string; name: string; placeholder: string; options: string[]; values?: string[] }) {
  return <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`demo-${name}`}>{label}<select id={`demo-${name}`} name={name} required defaultValue="" className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary"><option value="" disabled>{placeholder}</option>{options.map((option, index) => <option key={option} value={values[index]}>{option}</option>)}</select></label>
}

export { whatsappLink }
