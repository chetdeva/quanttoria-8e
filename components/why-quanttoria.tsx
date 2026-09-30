import Image from 'next/image'
import { Eye, Globe2, Sparkles, Trophy } from 'lucide-react'

const reasons = [
  {
    icon: Eye,
    color: 'bg-primary text-primary-foreground',
    title: 'Understanding first',
    body: <>We explain the <strong>why</strong> behind each method, so your child builds detailed understanding and reasoning instead of relying on memorised steps.</>,
  },
  {
    icon: Globe2,
    color: 'bg-mint text-mint-foreground',
    title: 'US curriculum support',
    body: 'Personalized support for Common Core, AP pathways and state standards from Grade 1 to 10.',
  },
  {
    icon: Trophy,
    color: 'bg-accent text-accent-foreground',
    title: "Ready for what's next",
    body: 'Strong foundations and thoughtful challenges help students feel confident and ready for classroom milestones, competitive exams, AP goals, and their next big step.',
  },
  {
    icon: Sparkles,
    color: 'bg-coral text-coral-foreground',
    title: 'Private and personalised',
    body: <><strong>Every lesson is shaped around one child</strong>: their pace, learning gaps, strengths, goals and confidence.</>,
  },
]

export function WhyQuanttoria() {
  return (
    <section id="why" className="scroll-mt-20 bg-sky py-20 lg:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
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

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">
                  Why Quanttoria
                </p>
                <h2 className="font-display text-balance text-5xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  Children are not bad or weak at maths. They just need a tailored approach.
                </h2>
                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                  We meet children where they are and bridge foundational gaps, train them to apply strategies, keep going when a problem is hard and analyse it rightfully.
                </p>
              </div>
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, index) => (
              <li
                key={r.title}
                className={`motion-rise motion-rise-delay-${index + 1} flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border transition-transform duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${r.color}`}>
                    <r.icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="font-display text-4xl font-extrabold text-primary/20">{index + 1}</span>
                </div>
                <h3 className="font-display text-xl font-bold">{r.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
