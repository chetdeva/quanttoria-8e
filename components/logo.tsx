import Image from 'next/image'
import { site } from '@/lib/site'

export function Logo({
  variant = 'mark',
  className = '',
}: {
  variant?: 'mark' | 'full'
  className?: string
}) {
  if (variant === 'full') {
    return (
      <Image
        src="/images/quanttoria-logo.png"
        alt={`${site.name} — Empowering Global Minds with Mathematics`}
        width={861}
        height={678}
        className={`h-auto w-48 max-w-full object-contain ${className}`}
        style={{ width: '12rem', height: 'auto' }}
      />
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/images/quanttoria-mark.png"
        alt=""
        width={455}
        height={430}
        className="size-10"
        priority
      />
      <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {site.name}
      </span>
    </span>
  )
}
