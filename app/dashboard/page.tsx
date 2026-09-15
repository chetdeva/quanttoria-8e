import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
export default async function DashboardPage() { const result = await getProfile(); if (!result) redirect('/login'); redirect(result.profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard') }
