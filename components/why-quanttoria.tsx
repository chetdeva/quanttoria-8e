import Image from 'next/image'
import { Eye, Globe2, Sparkles, Trophy } from 'lucide-react'

const reasons = [
  {
    icon: Eye,
    color: 'bg-primary text-primary-foreground',
    title: 'Understanding first',
    body: 'We explain the why behind each method, so children build genuine understanding instead of relying on memorised steps.',
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
    title: 'Ready for what&apos;s next',
    body: 'Strong foundations and thoughtful challenge help students feel ready for classroom milestones, AP goals and their next big step.',
  },
  {
    icon: Sparkles,
    color: 'bg-coral text-coral-foreground',
    title: 'Private and personalised',
    body: 'Every lesson is shaped around one child: their pace, learning gaps, strengths, goals and confidence.',
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
                Your child is not bad at maths. They may simply need the right approach.
              </h2>
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                We meet children where they are, close foundational gaps and build the confidence to reason, apply strategies and keep going when a problem is hard.
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
