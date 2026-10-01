import type { Metadata } from 'next'
import { requireRoleOrAdminView } from '@/lib/auth'
import { BookingsPage } from '@/components/bookings/bookings-page'

export const metadata: Metadata = { title: 'Student bookings | Quanttoria' }

export default async function TeacherBookings({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams
  const { profile, isAdminView } = await requireRoleOrAdminView('teacher', userId)
  return <BookingsPage role="teacher" profileId={profile.id} profileName={profile.full_name} isAdminView={isAdminView} />
}
