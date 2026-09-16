import Image from 'next/image'
import { Quote } from 'lucide-react'
import { site, whatsappLink } from '@/lib/site'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
    </svg>
  )
}

const credentials = [
  { label: 'Teaching hours', value: site.owner.hours },
  { label: 'Industry', value: 'Ed-Tech' },
  { label: 'Grades', value: '1 to 10' },
  { label: 'US pathways', value: 'Common Core + AP' },
]

export function MeetTutor() {
  return (
    <section id="tutor" className="scroll-mt-20 bg-primary py-20 text-primary-foreground lg:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="relative mx-auto flex w-full max-w-sm flex-col gap-5">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Meet our founder</p>
          <div className="overflow-hidden rounded-[2.5rem] border-4 border-primary-foreground/20 bg-accent shadow-2xl">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-07%20at%2010.38.02%20PM-iZtGml5nzUiPQoc6yx1X6ngQDdgDKl.jpeg"
              alt={`Portrait of ${site.owner.name}`}
              width={640}
              height={640}
              className="h-auto w-full object-cover"
            />
          </div>

        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {site.owner.name}
          </h2>
          <p className="text-lg font-semibold opacity-90">{site.owner.role} &amp; Personalised Maths Coach</p>

          <div className="flex flex-col items-start gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <WhatsAppIcon variant="white" className="size-5" />
              Connect on WhatsApp
            </a>
            <a
              href={site.owner.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground/10 px-5 py-2.5 text-sm font-bold ring-1 ring-primary-foreground/25 transition-colors hover:bg-primary-foreground/20"
            >
              <LinkedInIcon className="size-4" />
              Connect on LinkedIn
            </a>
          </div>

          <div className="relative rounded-3xl bg-primary-foreground/10 p-6 ring-1 ring-primary-foreground/15">
            <Quote className="absolute -top-4 left-6 size-8 text-accent" aria-hidden="true" />
            <p className="text-pretty text-lg leading-relaxed">
As educators, we have to envision the future and work backwards from there. Today, more than ever, students need the ability to think logically, solve problems, and approach challenges with confidence. Throughout my career, I’ve had the privilege of guiding hundreds of students, nurturing their passion for mathematics and inspiring them to reach for advanced learning and bigger goals.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-base leading-relaxed opacity-90">
            <p>
              Together, our coaches create an inclusive, interactive, supportive learning environment where questions are welcome, progress is visible and every student gets the right kind of challenge.
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {credentials.map((c) => (
                <div key={c.label} className="rounded-2xl bg-primary-foreground/10 px-4 py-3 ring-1 ring-primary-foreground/15">
                  <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">{c.label}</dt>
                  <dd className="font-display text-xl font-extrabold">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
