import { ArrowRight, CheckCircle2, ClipboardList, MessageCircle, TrendingUp, Video } from 'lucide-react'

const journey = [
  {
    step: '1',
    icon: MessageCircle,
    name: 'Tell us about your child',
    desc: 'Share their strengths, struggles, interests and goals. We listen before we teach.',
    tint: 'bg-accent text-accent-foreground',
  },
  {
    step: '2',
    icon: ClipboardList,
    name: 'Build your learning plan',
    desc: 'We match your child with a vetted maths coach tailored to their needs with their pace and lesson style.',
    tint: 'bg-primary text-foreground',
  },
  {
    step: '3',
    icon: Video,
    name: 'Your first demo lecture is free',
    desc: 'Meet your teacher in a live, personalized session. No obligation.',
    tint: 'bg-mint text-mint-foreground',
  },
  {
    step: '4',
    icon: TrendingUp,
    name: 'Learn, track, and grow',
    desc: 'Parents get clear feedback while children build skills, confidence and independence.',
    tint: 'bg-coral text-coral-foreground',
  },
]

const usBoards = [
  {
    name: 'Common Core',
    detail: 'Build strong foundations, reasoning and problem-solving habits.',
  },
  {
    name: 'AP Calculus',
    detail: 'Prepare for limits, derivatives, integrals and exam-style thinking.',
  },
  {
    name: 'AP Statistics',
    detail: 'Make data, probability and interpretation feel less intimidating.',
  },
  {
    name: 'State standards',
    detail: 'Stay aligned with your child’s local classroom expectations.',
  },
]

const outcomes = [
  'Clear understanding of concepts and the reasons behind each method and formula',
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
        <div className="grid items-center gap-8 md:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">How Quanttoria works</p>
            <h2 className="font-display text-balance text-5xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              A learning plan that grows with your child.
            </h2>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              Personalized learning is more than a worksheet with a name on it. We combine a thoughtful teacher, the right challenge and regular parent feedback to make every lesson count.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs font-bold uppercase tracking-wide text-primary">
              <span className="rounded-full bg-accent px-3 py-1.5">At their pace</span>
              <span className="rounded-full bg-secondary px-3 py-1.5">For their goals</span>
              <span className="rounded-full bg-mint/30 px-3 py-1.5">With real feedback</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl shadow-primary/10">
            <img
              src="/images/quanttoria-learning-tree.png"
              alt="Quanttoria learning journey tree showing curiosity, discovery, practice, growth, confidence, mastery, and future readiness"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden="true" className="pointer-events-none absolute left-[12%] right-[12%] top-10 hidden border-t-2 border-dashed border-primary/30 lg:block" />
          {journey.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="group relative flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className={`relative z-10 flex size-16 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-105 ${item.tint}`}>
                    <Icon className="size-7" aria-hidden="true" />
                  </div>
                  <span className="font-display text-4xl font-extrabold text-primary/20">{item.step}</span>
                </div>
                <h3 className="font-display text-2xl font-extrabold leading-tight">{item.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                {index < journey.length - 1 && <ArrowRight className="absolute -right-5 top-8 z-20 hidden size-6 text-primary lg:block" aria-hidden="true" />}
              </div>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-sky text-foreground shadow-xl shadow-primary/15 ring-1 ring-border">
          <div className="grid gap-8 p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold uppercase tracking-widest text-accent">US learning support</p>
              <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A plan that speaks your child&apos;s school language.</h3>
              <p className="text-base leading-relaxed opacity-90">From everyday classroom confidence to ambitious AP goals, we connect the dots between where your child is today and where they want to go next.</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-foreground/10 p-4 ring-1 ring-foreground/15"><p className="font-display text-2xl font-extrabold">1:1</p><p className="opacity-75">focused attention</p></div>
                <div className="rounded-2xl bg-foreground/10 p-4 ring-1 ring-foreground/15"><p className="font-display text-2xl font-extrabold">US</p><p className="opacity-75">standards-aware</p></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {usBoards.map((board) => (
                <div key={board.name} className="flex flex-col gap-2 rounded-2xl bg-foreground/10 p-5 ring-1 ring-foreground/15 transition-colors hover:bg-foreground/15">
                  <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-foreground">{board.name}</span>
                  <p className="text-sm leading-relaxed opacity-85">{board.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-foreground/15 px-8 py-4 text-sm font-semibold opacity-80 lg:px-10">Not sure which pathway fits? We&apos;ll help you choose a starting point.</div>
        </div>

        <div className="flex flex-col gap-5 rounded-[2rem] border-2 border-dashed border-primary/30 bg-accent/30 p-8 sm:flex-row sm:items-center sm:justify-between lg:p-10">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Start with confidence</p>
            <h3 className="font-display text-3xl font-extrabold tracking-tight">Your first demo lecture is free</h3>
            <p className="text-base leading-relaxed text-muted-foreground">A live, personalized session for your child to meet their teacher and experience the Quanttoria difference. No obligation.</p>
          </div>
          <a href="#demo" className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5">Book your free demo</a>
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
              Classes run live with a shared interactive whiteboard. Homework and class activities are shared after every session for repractice.
            </p>
            <p className="rounded-2xl bg-accent/40 p-4 text-sm font-semibold leading-relaxed text-accent-foreground">
              <strong>We develop more than IQ. Every class also builds patience, resilience and the adversity quotient your child needs to keep going when a problem is hard.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
