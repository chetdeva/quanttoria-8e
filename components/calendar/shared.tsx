export function AdminViewBanner({ role, profileName }: { role: 'student' | 'teacher'; profileName: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Admin test mode</p>
        <p className="mt-1 text-sm font-bold">
          Viewing {profileName}&apos;s {role} dashboard
        </p>
      </div>
      <a href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
        Return to admin
      </a>
    </div>
  )
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-3xl border border-border ${tone} p-5`}>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
    </div>
  )
}

export function EventCard({
  accent,
  title,
  meta,
  badge,
  children,
}: {
  accent: 'primary' | 'mint' | 'coral' | 'muted'
  title: string
  meta: string
  badge?: string
  children?: React.ReactNode
}) {
  const accentClass = {
    primary: 'bg-primary',
    mint: 'bg-mint',
    coral: 'bg-coral',
    muted: 'bg-border',
  }[accent]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-secondary pl-4">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${accentClass}`} aria-hidden="true" />
      <div className="p-4 pl-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
          </div>
          {badge && (
            <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-mint-foreground">
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
