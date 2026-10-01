import type { Metadata } from 'next'
import { requireRoleOrAdminView } from '@/lib/auth'
import { BookingsPage } from '@/components/bookings/bookings-page'

export const metadata: Metadata = { title: 'My bookings | Quanttoria' }

export default async function StudentBookings({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams
  const { profile, isAdminView } = await requireRoleOrAdminView('student', userId)
  return <BookingsPage role="student" profileId={profile.id} profileName={profile.full_name} isAdminView={isAdminView} />
}
