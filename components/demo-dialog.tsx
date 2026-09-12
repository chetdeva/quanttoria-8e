'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
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


export function DemoDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#demo') dialogRef.current?.showModal()
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  function close() {
    dialogRef.current?.close()
    setSubmitted(false)
    if (window.location.hash === '#demo') history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const parent = String(data.get('parent') ?? '')
    const child = String(data.get('child') ?? '')
    const grade = String(data.get('grade') ?? '')
    const phone = String(data.get('phone') ?? '')
    const timeZone = String(data.get('timeZone') ?? '')
    const timeSlot = String(data.get('timeSlot') ?? '')
    const message = `Hi Princy! I'd like to book a free demo lecture.\n\nParent: ${parent}\nChild: ${child}\nGrade: ${grade}\nPhone: ${phone}\nTime zone: ${timeZone}\nPreferred time: ${timeSlot}`
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  return (
    <>
      <a href="#demo" className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:bottom-7 sm:right-7">
        <WhatsAppIcon className="size-5" />
        <span>Register for a demo</span>
      </a>

      <dialog ref={dialogRef} aria-labelledby="demo-dialog-title" onCancel={close} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[2rem] border-0 bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/40">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">No obligation</p>
            <h2 id="demo-dialog-title" className="font-display text-3xl font-extrabold tracking-tight">Book your free demo</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Tell us a little about your child and we&apos;ll arrange a personalized trial lesson.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close demo registration" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><X className="size-5" /></button>
        </div>
        {submitted ? (
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="rounded-2xl bg-mint/40 p-5 text-sm leading-relaxed text-mint-foreground">Thanks! WhatsApp has opened so we can confirm a convenient time for your child&apos;s free demo.</div>
            <button type="button" onClick={close} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Done</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent/Guardian name" name="parent" placeholder="Your name" />
              <Field label="Child&apos;s name" name="child" placeholder="Their name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-bold" htmlFor="demo-grade">Child&apos;s grade
                <select id="demo-grade" name="grade" required defaultValue="" className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary"><option value="" disabled>Select grade</option>{grades.map((grade) => <option key={grade}>{grade}</option>)}</select>
              </label>
              <Field label="WhatsApp number" name="phone" placeholder="Your number" type="tel" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-bold" htmlFor="demo-time-zone">Your time zone
                <select id="demo-time-zone" name="timeZone" required defaultValue="" className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary"><option value="" disabled>Select time zone</option>{timeZones.map((timeZone) => <option key={timeZone.value} value={timeZone.label}>{timeZone.label}</option>)}</select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-bold" htmlFor="demo-time-slot">Convenient date and time
                <input id="demo-time-slot" name="timeSlot" type="datetime-local" required className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary" />
              </label>
            </div>
            <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"><WhatsAppIcon className="size-5" /> Request my free demo</button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">We&apos;ll only use these details to coordinate your demo lesson.</p>
          </form>
        )}
      </dialog>
    </>
  )
}

function Field({ label, name, placeholder, type = 'text' }: { label: string; name: string; placeholder: string; type?: string }) {
  return <label className="flex flex-col gap-2 text-sm font-bold" htmlFor={`demo-${name}`}>{label}<input id={`demo-${name}`} name={name} type={type} required placeholder={placeholder} className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-primary" /></label>
}

