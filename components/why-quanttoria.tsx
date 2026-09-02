import Image from 'next/image'
import { Eye, Globe2, Sparkles, Trophy } from 'lucide-react'

const reasons = [
  {
    icon: Eye,
    color: 'bg-primary text-primary-foreground',
    title: 'Visual first',
    body: 'Fractions become pizzas, algebra becomes balance scales. Kids see the concept before they memorise the rule, and the fear of numbers disappears.',
  },
  {
    icon: Globe2,
    color: 'bg-mint text-mint-foreground',
    title: 'Global curriculum',
    body: 'Built to international standards so your child can compete anywhere in the world, not just keep up with the class next door.',
  },
  {
    icon: Trophy,
    color: 'bg-accent text-accent-foreground',
    title: 'Exam ready',
    body: 'Advanced concepts introduced early, applied in novel scenarios, so Math Olympiad, SAT and NAPLAN questions feel familiar, not frightening.',
  },
  {
    icon: Sparkles,
    color: 'bg-coral text-coral-foreground',
    title: 'Personalised and engaging',
    body: 'Every lesson is planned for one child. Rigorous, insightful and genuinely fun, whatever level they start at.',
  },
]

export function WhyQuanttoria() {
  return (
    <section id="why" className="scroll-mt-20 bg-sky py-20 lg:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-[2rem] border-4 border-background shadow-xl shadow-primary/10">
              <Image
                src="/images/visual-math.png"
                alt="Two children pointing excitedly at a whiteboard showing fractions, blocks and shapes"
                width={1024}
                height={768}
                loading="eager"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="order-1 flex flex-col gap-8 lg:order-2">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                Why Quanttoria
              </p>
              <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Kids don&apos;t hate math. They hate not <em className="not-italic text-primary">seeing</em> it.
              </h2>
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                Every concept is built systematically to create mathematical thinkers who solve
                real-world problems with confidence and go on to surpass their grade level.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {reasons.map((r) => (
                <li
                  key={r.title}
                  className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border"
                >
                  <span
                    className={`inline-flex size-11 items-center justify-center rounded-xl ${r.color}`}
                  >
                    <r.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-xl font-bold">{r.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
