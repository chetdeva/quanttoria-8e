import { site } from '@/lib/site'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="font-display inline-flex size-9 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground"
      >
        Q
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {site.name}
      </span>
    </span>
  )
}
