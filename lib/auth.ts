import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('id, full_name, role').eq('id', user.id).maybeSingle()
  return profile ? { user, profile } : null
}

export async function requireRole(role: 'teacher' | 'student' | 'admin') {
  const result = await getProfile()
  if (!result) redirect('/login')
  if (result.profile.role !== role) {
    redirect(result.profile.role === 'admin' ? '/dashboard' : result.profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }
  return result
}

export async function requireRoleOrAdminView(role: 'teacher' | 'student', viewedUserId?: string) {
  const result = await getProfile()
  if (!result) redirect('/login')

  if (result.profile.role === role && (!viewedUserId || viewedUserId === result.profile.id)) {
    return { ...result, isAdminView: false }
  }

  if (result.profile.role !== 'admin' || !viewedUserId) {
    redirect(result.profile.role === 'admin' ? '/dashboard' : result.profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }

  const supabase = await createClient()
  const { data: viewedProfile } = await supabase.from('profiles').select('id, full_name, role').eq('id', viewedUserId).eq('role', role).maybeSingle()
  if (!viewedProfile) redirect('/dashboard')

  return { user: result.user, profile: viewedProfile, isAdminView: true }
}
