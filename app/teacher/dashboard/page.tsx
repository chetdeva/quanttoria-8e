import { requireRoleOrAdminView } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { TeacherCalendar } from '@/components/class-calendar'

export default async function TeacherDashboard({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams
  const { profile, isAdminView } = await requireRoleOrAdminView('teacher', userId)
  return <><TeacherCalendar profileName={profile.full_name} profileId={profile.id} isAdminView={isAdminView} />{!isAdminView && <div className="fixed right-4 top-4"><SignOutButton /></div>}</>
}
