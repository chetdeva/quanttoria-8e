import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin-dashboard'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') {
    redirect(profile?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }

  const [{ data: profiles }, { data: sessions }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase.from('class_sessions').select('id, teacher_id, title, starts_at, ends_at, status, topic').order('starts_at', { ascending: false }),
    supabase.from('class_bookings').select('id, session_id, student_id, status, topic, created_at, class_sessions(id, teacher_id, title, starts_at, ends_at, status, topic)').order('created_at', { ascending: false }),
  ])

  return <AdminDashboard currentUser={profile} profiles={profiles ?? []} sessions={sessions ?? []} bookings={bookings ?? []} />
}
