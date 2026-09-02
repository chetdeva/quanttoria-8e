import { CheckCircle2 } from 'lucide-react'

const methods = [
  {
    name: 'Vedic',
    tint: 'bg-accent text-accent-foreground',
    desc: 'Lightning-fast mental math techniques that make calculation feel like a game.',
  },
  {
    name: 'Abstract',
    tint: 'bg-primary text-primary-foreground',
    desc: 'Patterns, logic and reasoning that transfer to any new problem your child meets.',
  },
  {
    name: 'NAPLAN',
    tint: 'bg-mint text-mint-foreground',
    desc: 'Aligned to the Australian national benchmark for numeracy, year by year.',
  },
  {
    name: 'Global',
    tint: 'bg-coral text-coral-foreground',
    desc: 'Common Core, Singapore and Olympiad-style problem solving, blended into one path.',
  },
]

const outcomes = [
  'Deep understanding of core concepts and algorithms',
  'Confidence solving complex, multi-step equations',
  'Practical application of math in real-life situations',
  'Preparation for Math Olympiads, SATs and NAPLAN',
  'Logical thinking that serves them long after the exam',
]

const grades = ['Grade 1-2', 'Grade 3-5', 'Grade 6-8', 'Olympiad', 'SAT prep']

export function Approach() {
  return (
    <section id="approach" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Our approach</p>
          <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Four traditions of math. One clear path.
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            We stand in the future and work backwards. Our curriculum blends the best of Vedic,
            abstract, NAPLAN and global mathematics so kids learn how math actually works, not
            just how to pass the next test.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {methods.map((m) => (
            <div
              key={m.name}
              className={`flex flex-col gap-3 rounded-3xl p-6 ${m.tint} transition-transform hover:-translate-y-1`}
            >
              <h3 className="font-display text-3xl font-extrabold">{m.name}</h3>
              <p className="text-sm leading-relaxed opacity-90">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-10 rounded-[2rem] bg-secondary p-8 lg:grid-cols-[1.2fr_1fr] lg:p-12">
          <div className="flex flex-col gap-6">
            <h3 className="font-display text-3xl font-extrabold tracking-tight">
              What your child walks away with
            </h3>
            <ul className="flex flex-col gap-3">
              {outcomes.map((o) => (
                <li key={o} className="flex items-start gap-3 text-base leading-relaxed">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="font-display text-2xl font-bold">Who we teach</h3>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Classes run live on Zoom with a shared interactive whiteboard, GeoGebra activities
              and Khan Academy-aligned practice. Homework and class activities are shared after
              every session.
            </p>
            <p className="rounded-2xl bg-accent/40 p-4 text-sm font-semibold leading-relaxed text-accent-foreground">
              We develop more than IQ. Every class also builds patience, resilience and the
              adversity quotient your child needs to keep going when a problem is hard.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
