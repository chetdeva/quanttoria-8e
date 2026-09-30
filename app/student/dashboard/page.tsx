import { requireRoleOrAdminView } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { StudentCalendar } from '@/components/class-calendar'

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams
  const { profile, isAdminView } = await requireRoleOrAdminView('student', userId)
  return <><StudentCalendar profileName={profile.full_name} profileId={profile.id} isAdminView={isAdminView} />{!isAdminView && <div className="fixed right-4 top-4"><SignOutButton /></div>}</>
}
