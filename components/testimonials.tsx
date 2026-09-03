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

        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li
              key={r.name + r.text.slice(0, 24)}
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
