import { createClient } from '@/lib/supabase/server'
import { bookingFields, sessionFields, type Booking, type Snapshot } from './types'
import { validDuration } from './booking-rules'

export class CalendarError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export async function calendarIdentity(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new CalendarError('Please sign in to use the calendar.',401)
  const { data: profile } = await supabase.from('profiles').select('id,role').eq('id',user.id).maybeSingle()
  if (!profile) throw new CalendarError('Profile not found.',403)
  const requested = new URL(request.url).searchParams.get('userId') || user.id
  if (requested !== user.id && profile.role !== 'admin') throw new CalendarError('Not authorized.',403)
  const { data: target } = requested===user.id ? { data: profile } : await supabase.from('profiles').select('id,role').eq('id',requested).maybeSingle()
  if (!target || !['teacher','student','admin'].includes(target.role)) throw new CalendarError('Profile not found.',404)
  return { supabase, user, profile: target, isAdminView: requested!==user.id }
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin')!==new URL(request.url).origin) throw new CalendarError('Invalid request origin.',403)
}
export function errorResponse(error: unknown) {
  return Response.json({error: error instanceof CalendarError ? error.message : 'Could not load the calendar. Please try again.'}, {status: error instanceof CalendarError ? error.status : 500, headers:{'Cache-Control':'no-store'}})
}
export function normalizeBooking(row: Record<string, unknown>): Booking {
  return { ...row, class_sessions: Array.isArray(row.class_sessions) ? row.class_sessions[0] ?? null : row.class_sessions } as Booking
}
export async function snapshot(request: Request): Promise<Snapshot> {
  const { supabase,profile } = await calendarIdentity(request)
  const [teachers,sessions,hours,bookings,credits] = await Promise.all([
    supabase.from('teacher_calendar_profiles').select('teacher_id,display_name,subject,grade_range'),
    supabase.from('class_sessions').select(sessionFields).gte('ends_at',new Date().toISOString()).lte('starts_at',new Date(Date.now()+90*86400000).toISOString()).order('starts_at'),
    supabase.from('teacher_availability').select('id,teacher_id,day_of_week,start_time,end_time,timezone,is_active').eq('is_active',true),
    supabase.from('class_bookings').select(bookingFields).eq('student_id',profile.id).order('created_at',{ascending:false}),
    supabase.from('student_calendar_credits').select('balance_minutes').eq('student_id',profile.id).maybeSingle(),
  ])
  if ([teachers,sessions,hours,bookings].some(r=>r.error)) throw new CalendarError('Calendar setup is incomplete. Apply the native calendar migration.',503)
  return {teachers:teachers.data??[],sessions:sessions.data??[],availability:hours.data??[],bookings:(bookings.data??[]).map(normalizeBooking),availableCredits:credits.error ? null : (credits.data?.balance_minutes ?? 0)/60}
}

export async function reserve(request: Request) {
  sameOrigin(request)
  const {supabase,profile,isAdminView}=await calendarIdentity(request)
  if (profile.role!=='student') throw new CalendarError('Only students can book a class.',403)
  const input=await request.json().catch(()=>{throw new CalendarError('Invalid request.')})
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CalendarError('Invalid request.')
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(input.teacherId||'') || !validDuration(input.duration) || !['trial','regular'].includes(input.classType) || !['zoom','google_meet'].includes(input.provider) || typeof input.startsAt!=='string' || !Number.isFinite(Date.parse(input.startsAt)) || typeof input.topic!=='string' || input.topic.length>2000 || (input.replaceId && !uuid.test(input.replaceId))) throw new CalendarError('Choose a teacher, class, duration (15–180 minutes in 15-minute steps) and time.')
  const {data,error}=await supabase.rpc('calendar_reserve',{p_teacher:input.teacherId,p_start:input.startsAt,p_minutes:input.duration,p_class:input.classType,p_provider:input.provider,p_topic:input.topic,p_student:profile.id,p_replace:input.replaceId||null})
  if (error) throw new CalendarError(error.code==='P0002' ? 'Not enough credits. Please contact your teacher to add credits.' : error.code==='23P01' ? 'This time is no longer available. Choose another slot.' : 'Could not book this time. Refresh and try again.',error.code==='23P01'?409:400)
  return {id:data as string,isAdminView,replaceId:input.replaceId as string|undefined}
}
