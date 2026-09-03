import Image from 'next/image'
import { MessageCircle, Quote } from 'lucide-react'
import { site, whatsappLink } from '@/lib/site'

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
  { label: 'Grades', value: '1 to 8' },
  { label: 'Focus', value: 'Olympiad, SAT, NAPLAN' },
]

export function MeetTutor() {
  return (
    <section id="tutor" className="scroll-mt-20 bg-primary py-20 text-primary-foreground lg:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="relative mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-[2.5rem] border-4 border-primary-foreground/20 bg-accent shadow-2xl">
            <Image
              src="/images/princy-avatar.png"
              alt={`Illustrated portrait of ${site.owner.name}`}
              width={640}
              height={640}
              className="h-auto w-full object-cover"
            />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            {credentials.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl bg-primary-foreground/10 px-4 py-3 ring-1 ring-primary-foreground/15"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {c.label}
                </dt>
                <dd className="font-display text-xl font-extrabold">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Meet your tutor</p>
          <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {site.owner.name}
          </h2>
          <p className="text-lg font-semibold opacity-90">{site.owner.role}</p>

          <div className="flex flex-col items-start gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
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
              As educators, we have to stand in the future and work backwards from there. Students
              need logical thinking more than ever. Throughout my career I&apos;ve guided hundreds
              of students, nurturing their passion for math and motivating them to pursue advanced
              education.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-base leading-relaxed opacity-90">
            <p>
              With over {site.owner.hours} hours of teaching in the Ed-Tech industry, Princy
              bases her curriculum on a blend of Vedic, abstract, NAPLAN and global mathematics,
              helping learners grasp the practical applications of math in real life.
            </p>
            <p>
              She is dedicated to creating an inclusive, supportive learning environment and
              advocates for improved access to quality math education for every student, whatever
              their starting point.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
