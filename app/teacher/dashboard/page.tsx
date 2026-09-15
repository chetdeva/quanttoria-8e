import { requireRole } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { TeacherCalendar } from '@/components/class-calendar'

export default async function TeacherDashboard() {
  const { profile } = await requireRole('teacher')
  return <><TeacherCalendar profileName={profile.full_name} /><div className="fixed right-4 top-4"><SignOutButton /></div></>
}
