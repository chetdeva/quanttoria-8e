import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('id, full_name, role').eq('id', user.id).maybeSingle()
  return profile ? { user, profile } : null
}

export async function requireRole(role: 'teacher' | 'student') {
  const result = await getProfile()
  if (!result) redirect('/login')
  if (result.profile.role !== role) redirect(result.profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  return result
}
