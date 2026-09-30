'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

const reviews = [
  {
    name: 'Chandan Kumar Anjani',
    location: 'United States',
    rating: 5,
    text: 'I started with a demo class with Ms Princy Sugandh. My daughters got so much involved in the first class that she wanted to join because of the demo class only. We are close to completing 1 year with Princy. I felt she pushes my daughter to get the best out of her and sets a pretty high standard in teaching. She puts a lot of effort not only into improving her in the subject she is teaching, but otherwise as well. She appreciates a good job and gives feedback to parents when needed to help improve as well. Thanks for being her teacher.',
  },
  {
    name: 'Parent',
    location: 'United States',
    rating: 5,
    text: 'Ms Princy Sugandh has been our son’s math teacher for the past year. We have seen our child’s math skill set improve considerably under her guidance. She is punctual, stern, helps him problem solve as well as encourages him to critically think before tackling problems. She has set high expectations for our child and puts a lot of effort into her teaching each class. We are very grateful to having her as our son’s teacher, for her expertise and her commitment towards our child.',
  },
  {
    name: 'Shilpi',
    location: 'United States',
    rating: 5,
    text: 'Thank you Miss Princy Sugandh for teaching my kid math in an amazing style. He is very happy to learn all the new techniques. Thank you once again.',
  },
  {
    name: 'Georgene Rondero',
    location: 'United States',
    rating: 5,
    text: 'My son, who is autistic with learning disabilities, is really doing well all due to his fantastic instructor, Princy Sugandh. She is so patient and kind, but firm and demands that he always performs his best. I would wholeheartedly recommend this program for anyone!',
  },
  {
    name: 'Parent',
    location: 'United States',
    rating: 5,
    text: 'Ms Princy Sugandh was my son’s teacher. She was an excellent teacher, very patient with my son — he is autistic, it was challenging during some classes but she handled it very well. My son loved her classes and she became a trusted advisor for me as well in regards to ways of handling his condition. She is very detailed. Thank you Ms Princy for being a part of his learning!',
  },
  {
    name: 'Gaya N.',
    location: 'Canada',
    rating: 5,
    text: 'Princy is an amazing teacher, very assertive and goal oriented with my son. She challenges him to be his best.',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-5 ${i < count ? 'fill-accent text-accent' : 'text-border'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function Testimonials() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const updateActiveIndex = () => {
      const cards = Array.from(carousel.children)
      const closestIndex = cards.reduce((closest, card, index) => {
        const currentDistance = Math.abs((card as HTMLElement).offsetLeft - carousel.scrollLeft)
        const closestDistance = Math.abs((cards[closest] as HTMLElement).offsetLeft - carousel.scrollLeft)
        return currentDistance < closestDistance ? index : closest
      }, 0)
      const nextIndex = Math.min(closestIndex, reviews.length - 1)
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
    }

    carousel.addEventListener('scroll', updateActiveIndex, { passive: true })
    return () => carousel.removeEventListener('scroll', updateActiveIndex)
  }, [])

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      scrollToReview((activeIndexRef.current + 1) % reviews.length)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  function scrollToReview(index: number) {
    const carousel = carouselRef.current
    const card = carousel?.children[index] as HTMLElement | undefined
    if (carousel && card) {
      carousel.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
    }
    activeIndexRef.current = index
    setActiveIndex(index)
  }

  return (
    <section id="reviews" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Why parents trust us
            </p>
            <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Progress feels better when families are part of the journey.
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['20,000+', 'teaching hours'],
            ['1:1', 'live attention'],
            ['100%', 'personalized plans'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-secondary px-5 py-4">
              <p className="font-display text-3xl font-extrabold text-primary">{value}</p>
              <p className="text-sm font-bold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-extrabold text-primary">Clients rated us 5 stars on Trustpilot</h3>
            <Button
              variant="link"
              className="h-auto rounded-full p-0 font-bold text-foreground underline-offset-4 hover:text-primary"
              nativeButton={false} render={<a href={site.trustpilotUrl} target="_blank" rel="noopener noreferrer" />}
            >
              Read all reviews
              <ExternalLink className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-6 py-4 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Parent testimonials carousel"
          >
            {reviews.map((r, index) => (
              <a
                key={r.name + r.text.slice(0, 24)}
                href={site.trustpilotUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${r.name}'s review in the Trustpilot search results`}
                className="flex w-[min(82vw,22rem)] shrink-0 snap-start flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border transition-transform hover:-translate-y-1 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-[22rem]"
              >
                <Stars count={r.rating} />
                <blockquote className="flex-1 text-pretty text-base leading-relaxed text-foreground">
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <footer className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="font-bold">{r.name}</span>
                    <span className="text-sm text-muted-foreground">{r.location}</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-primary" aria-hidden="true" />
                </footer>
              </a>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2" aria-label="Choose a testimonial">
            {reviews.map((review, index) => (
              <button
                key={`${review.name}-${index}-dot`}
                type="button"
                onClick={() => scrollToReview(index)}
                aria-label={`Show testimonial ${index + 1}`}
                aria-current={activeIndex === index ? 'true' : undefined}
                className={`rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${activeIndex === index ? 'h-2.5 w-7 bg-primary' : 'size-2.5 bg-border hover:bg-primary/50'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
