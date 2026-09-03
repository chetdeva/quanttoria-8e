import { Logo } from '@/components/logo'
import { navLinks, site, whatsappLink } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo variant="full" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Live online math classes for grades 1 to 8, taught by {site.owner.name}.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-muted-foreground hover:text-primary"
          >
            WhatsApp
          </a>
          <a href={`mailto:${site.email}`} className="font-semibold text-muted-foreground hover:text-primary">
            {site.email}
          </a>
          <a
            href={site.trustpilotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-muted-foreground hover:text-primary"
          >
            Trustpilot
          </a>
        </div>
      </div>
      <div className="mx-auto mt-10 w-full max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
        &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  )
}
