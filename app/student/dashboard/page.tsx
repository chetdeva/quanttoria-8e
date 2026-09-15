import { requireRole } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { StudentCalendar } from '@/components/class-calendar'

export default async function StudentDashboard() {
  const { profile } = await requireRole('student')
  return <><StudentCalendar profileName={profile.full_name} /><div className="fixed right-4 top-4"><SignOutButton /></div></>
}
