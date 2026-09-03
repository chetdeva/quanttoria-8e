'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { navLinks, site, whatsappLink } from '@/lib/site'
import { Logo } from '@/components/logo'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#top" className="flex items-center gap-2" aria-label={`${site.name} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            className="rounded-full font-bold"
            nativeButton={false} render={<a href={whatsappLink()} target="_blank" rel="noopener noreferrer" />}
          >
            <WhatsAppIcon variant="white" className="size-4" />
            Book a free trial
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-border bg-background px-4 py-4 md:hidden"
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-secondary"
            >
              {l.label}
            </a>
          ))}
          <Button
            className="mt-2 rounded-full font-bold"
            nativeButton={false} render={<a href={whatsappLink()} target="_blank" rel="noopener noreferrer" />}
          >
            <WhatsAppIcon variant="white" className="size-4" />
            Book a free trial
          </Button>
        </nav>
      )}
    </header>
  )
}
