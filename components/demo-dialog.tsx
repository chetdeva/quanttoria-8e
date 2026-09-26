'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { DemoCalendar } from '@/components/demo-calendar/demo-calendar'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function DemoDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#demo' && !dialogRef.current?.open) dialogRef.current?.showModal()
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

  return (
    <>
      <a href="#demo" className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:bottom-7 sm:right-7">
        <WhatsAppIcon className="size-5" />
        <span>Register for a demo</span>
      </a>

      <dialog ref={dialogRef} aria-labelledby="demo-dialog-title" onCancel={close} className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-[2rem] border-0 bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/40">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">No obligation</p>
            <h2 id="demo-dialog-title" className="font-display text-3xl font-extrabold tracking-tight">Book your free demo</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Tell us a little about your child, then choose a date and time that works for you.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close demo registration" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><X className="size-5" /></button>
        </div>
        {submitted ? (
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="rounded-2xl bg-mint/40 p-5 text-sm leading-relaxed text-mint-foreground">Thanks! WhatsApp has opened so we can confirm a convenient time for your child&apos;s free demo.</div>
            <button type="button" onClick={close} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Done</button>
          </div>
        ) : <DemoCalendar onSubmitted={() => setSubmitted(true)} />}
      </dialog>
    </>
  )
}

