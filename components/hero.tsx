import Image from 'next/image'
import { ArrowRight, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { site, whatsappLink } from '@/lib/site'

export function Hero() {
  return (
    <section id="top" className="bg-graph-paper relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
            <Star className="size-4 fill-current" aria-hidden="true" />
            Live 1:1 online classes for Grades 1 to 8
          </span>

          <h1 className="font-display text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Turn <span className="text-primary">number-fear</span> into math{' '}
            <span className="relative isolate inline-block">
              confidence
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 -z-10 h-4 w-full rounded-full bg-accent/80"
              />
            </span>
            .
          </h1>

          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {site.name} teaches math visually, so kids actually see how it works. With a global
            curriculum blending Vedic, abstract and NAPLAN methods, your child masters the
            fundamentals and gets ready for Math Olympiads, SATs and beyond.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-12 rounded-full px-6 text-base font-bold"
              nativeButton={false} render={<a href={whatsappLink()} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Book your free trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-2 px-6 text-base font-bold"
              nativeButton={false} render={<a href="#approach" />}
            >
              See how we teach
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Teaching experience
              </dt>
              <dd className="font-display text-3xl font-extrabold text-foreground">
                {site.owner.hours} hrs
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Class format
              </dt>
              <dd className="font-display text-3xl font-extrabold text-foreground">1 : 1 live</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                First class
              </dt>
              <dd className="font-display text-3xl font-extrabold text-primary">Free</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-background bg-sky shadow-2xl shadow-primary/15">
            <Image
              src="/images/hero-kid-math.png"
              alt="A smiling child learning math on a laptop, surrounded by fractions, shapes and numbers"
              width={800}
              height={800}
              priority
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="absolute -left-3 top-8 hidden rotate-[-6deg] rounded-2xl bg-coral px-4 py-2 font-display text-lg font-bold text-coral-foreground shadow-lg sm:block">
            3/4 + 1/4 = 1
          </div>
          <div className="absolute -right-3 bottom-10 hidden rotate-[5deg] rounded-2xl bg-mint px-4 py-2 font-display text-lg font-bold text-mint-foreground shadow-lg sm:block">
            Olympiad ready
          </div>
        </div>
      </div>
    </section>
  )
}
