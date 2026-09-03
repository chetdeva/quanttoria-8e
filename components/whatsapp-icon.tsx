import Image from 'next/image'

const sources = {
  green: '/images/whatsapp-glyph.png',
  white: '/images/whatsapp-glyph-white.png',
} as const

export function WhatsAppIcon({
  className = 'size-5',
  variant = 'green',
}: {
  className?: string
  variant?: keyof typeof sources
}) {
  return (
    <Image
      src={sources[variant]}
      alt=""
      width={150}
      height={150}
      className={className}
      aria-hidden="true"
    />
  )
}
