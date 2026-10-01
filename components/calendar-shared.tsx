'use client'
import { CalendarDays, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export type CalendarProps = {
  profileName: string | null
  profileId: string
  isAdminView?: boolean
}
export type { Session, Booking, Availability } from '@/lib/calendar/types'
export { sessionFields } from '@/lib/calendar/types'
export const formatTime = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
export const dateKey = (value: string | Date) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}
export const localInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

export function CalendarShell({
  role,
  profileName,
  isAdminView,
  timezone,
  loading,
  onRefresh,
  children,
}: CalendarProps & {
  role: 'student' | 'teacher'
  timezone: string
  loading: boolean
  onRefresh: () => void
  children: React.ReactNode
}) {
  const name =
    profileName?.trim() || (role === 'teacher' ? 'Teacher' : 'Student')
  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {isAdminView && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-card p-4">
            <p className="text-sm font-bold">
              Admin preview · {name}&apos;s {role} dashboard
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
            >
              Return to admin
            </Button>
          </div>
        )}
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 pt-5 sm:pt-0">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
              <CalendarDays className="size-5" />
              {role === 'teacher' ? 'Teacher workspace' : 'Student space'}
            </div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {role === 'teacher'
                ? 'Schedule matrix'
                : `Find your next class, ${name.split(' ')[0]}`}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {role === 'teacher'
                ? 'Plan your week. Publish times for students to book.'
                : 'Choose a date and reserve a time with your tutor.'}{' '}
              · {timezone || 'Loading timezone…'}
            </p>
          </div>
          <Button variant="outline" disabled={loading} onClick={onRefresh}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </header>
        {children}
      </div>
    </main>
  )
}
