import { ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

/**
 * PLACEHOLDER REVIEWS: replace each entry with the real Trustpilot review text,
 * reviewer name and location. Keep `rating` between 1 and 5.
 */
const reviews = [
  {
    name: 'Parent of a Grade 4 student',
    location: 'Sydney, Australia',
    rating: 5,
    text: 'Placeholder review. Replace this with a real Trustpilot review about how the classes helped your child with fractions and confidence.',
  },
  {
    name: 'Parent of a Grade 7 student',
    location: 'Dubai, UAE',
    rating: 5,
    text: 'Placeholder review. Replace this with a real Trustpilot review about Olympiad preparation and Princy\u2019s teaching style.',
  },
  {
    name: 'Parent of a Grade 2 student',
    location: 'Bengaluru, India',
    rating: 5,
    text: 'Placeholder review. Replace this with a real Trustpilot review about how a young child started enjoying math.',
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
  return (
    <section id="reviews" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Parents on Trustpilot
            </p>
            <h2 className="font-display text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              What families say about learning with {site.owner.name.split(' ')[0]}
            </h2>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-2 font-bold"
            nativeButton={false} render={<a href={site.trustpilotUrl} target="_blank" rel="noopener noreferrer" />}
          >
            Read all reviews on Trustpilot
            <ExternalLink className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <li
              key={r.name + r.location}
              className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border"
            >
              <Stars count={r.rating} />
              <blockquote className="flex-1 text-pretty text-base leading-relaxed text-foreground">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="flex flex-col">
                <span className="font-bold">{r.name}</span>
                <span className="text-sm text-muted-foreground">{r.location}</span>
              </figcaption>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
