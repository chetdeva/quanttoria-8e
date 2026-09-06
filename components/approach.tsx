import { CheckCircle2 } from 'lucide-react'

const journey = [
  {
    step: '01',
    name: 'Tell us about your child',
    desc: 'Share their strengths, struggles, interests and goals. We listen before we teach.',
    tint: 'bg-accent text-accent-foreground',
  },
  {
    step: '02',
    name: 'Build your learning plan',
    desc: 'We match the right teacher, pace, lesson style and practice for your learner.',
    tint: 'bg-primary text-primary-foreground',
  },
  {
    step: '03',
    name: 'Your first demo lecture is completely free',
    desc: 'Meet your teacher in a live, personalized session. No obligation. No credit card.',
    tint: 'bg-mint text-mint-foreground',
  },
  {
    step: '04',
    name: 'Learn, track, and grow',
    desc: 'Parents get clear feedback while children build skills, confidence and independence.',
    tint: 'bg-coral text-coral-foreground',
  },
]

const usBoards = ['Common Core', 'AP Calculus', 'AP Statistics', 'State standards']

const outcomes = [
  'Clear understanding of concepts and the reasons behind each method',
  'Confidence analysing word problems and unfamiliar questions',
  'Practical strategies for applying maths beyond worked examples',
  'Preparation for global curricula, assessments and competitions',
  'Resilience, independence and logical thinking that lasts',
]

const grades = ['Grade 1-2', 'Grade 3-5', 'Grade 6-8', 'Grade 9-10', 'US standards']

export function Approach() {
  return (
    <section id="approach" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">How Quanttoria works</p>
          <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            A learning plan that grows with your child.
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Personalized learning is more than a worksheet with a name on it. We combine a thoughtful teacher, the right challenge and regular parent feedback to make every lesson count.
          </p>
        </div>

        <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-8 hidden border-t-2 border-dashed border-primary/25 lg:block" />
          {journey.map((item) => (
            <div key={item.step} className="relative flex flex-col gap-3">
              <div className={`z-10 flex size-16 items-center justify-center rounded-2xl font-display text-2xl font-extrabold shadow-lg ${item.tint}`}>
                {item.step}
              </div>
              <h3 className="font-display text-2xl font-extrabold leading-tight">{item.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-xl shadow-primary/15 lg:grid-cols-[1.1fr_1fr] lg:p-10">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">US learning support</p>
            <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Ready for the classroom, confident beyond it.</h3>
            <p className="text-base leading-relaxed opacity-90">We currently support families across the United States with learning plans aligned to the standards and pathways that matter to them.</p>
          </div>
          <div className="flex flex-wrap content-start gap-3 lg:justify-end">
            {usBoards.map((board) => (
              <span key={board} className="rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-bold ring-1 ring-primary-foreground/20">{board}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-[2rem] border-2 border-dashed border-primary/30 bg-accent/30 p-8 sm:flex-row sm:items-center sm:justify-between lg:p-10">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Start with confidence</p>
            <h3 className="font-display text-3xl font-extrabold tracking-tight">Your First Demo Lecture is Completely Free</h3>
            <p className="text-base leading-relaxed text-muted-foreground">A live, personalized session for your child to meet their teacher and experience the Quanttoria difference. No obligation. No credit card.</p>
          </div>
          <a href="#contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5">Customize your plan</a>
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
