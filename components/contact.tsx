'use client'

import { useState, type FormEvent } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { site, whatsappLink } from '@/lib/site'

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']

export function Contact() {
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const parent = String(data.get('parent') ?? '')
    const child = String(data.get('child') ?? '')
    const grade = String(data.get('grade') ?? '')
    const goal = String(data.get('goal') ?? '')

    const message = `Hi Princy! I'd like to book a free trial class.\n\nParent: ${parent}\nChild: ${child}\nGrade: ${grade}\nGoal: ${goal}`

    if (channel === 'whatsapp') {
      window.open(whatsappLink(message), '_blank', 'noopener,noreferrer')
    } else {
      const subject = encodeURIComponent(`Free trial enquiry - ${child} (${grade})`)
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${encodeURIComponent(message)}`
    }
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-sky py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Book a free trial
          </p>
          <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Ready to unlock your child&apos;s full potential in math?
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Tell us a little about your child and we&apos;ll get back to you with trial slots.
            No commitment, no payment details, just one great class.
          </p>

          <ul className="flex flex-col gap-3">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-mint text-mint-foreground">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="font-bold">WhatsApp us</span>
                  <span className="text-sm text-muted-foreground">Fastest reply, usually within a few hours</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:ring-primary"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="font-bold">Email us</span>
                  <span className="text-sm text-muted-foreground">{site.email}</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-[2rem] bg-card p-6 shadow-xl shadow-primary/10 ring-1 ring-border sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent's name" name="parent" placeholder="Your name" required />
            <Field label="Child's name" name="child" placeholder="Their name" required />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="grade" className="text-sm font-bold">
              Child&apos;s grade
            </label>
            <select
              id="grade"
              name="grade"
              required
              defaultValue=""
              className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base outline-none focus-visible:border-primary"
            >
              <option value="" disabled>
                Select a grade
              </option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="goal" className="text-sm font-bold">
              What would you like help with?
            </label>
            <textarea
              id="goal"
              name="goal"
              rows={3}
              placeholder="e.g. Fractions are a struggle, or preparing for a Math Olympiad"
              className="rounded-xl border-2 border-input bg-background px-3 py-2 text-base leading-relaxed outline-none focus-visible:border-primary"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-bold">Send via</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              {(['whatsapp', 'email'] as const).map((c) => (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold capitalize transition-colors ${
                    channel === c ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={c}
                    checked={channel === c}
                    onChange={() => setChannel(c)}
                    className="sr-only"
                  />
                  {c === 'whatsapp' ? (
                    <MessageCircle className="size-4" aria-hidden="true" />
                  ) : (
                    <Mail className="size-4" aria-hidden="true" />
                  )}
                  {c}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="h-12 rounded-full text-base font-bold">
            Request my free trial
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            We only use your details to arrange the trial class.
          </p>
        </form>
      </div>
    </section>
  )
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string
  name: string
  placeholder: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl border-2 border-input bg-background px-3 text-base outline-none focus-visible:border-primary"
      />
    </div>
  )
}
