import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { sessionFields } from './types'

async function api(url: string, init: RequestInit) {
  const response=await fetch(url,{...init,signal:AbortSignal.timeout(12000),cache:'no-store'})
  if(!response.ok) throw new Error('Video provider request failed')
  return response.status===204 ? null : response.json()
}
async function zoomToken() {
  const {ZOOM_CLIENT_ID:id,ZOOM_CLIENT_SECRET:secret,ZOOM_ACCOUNT_ID:account}=process.env
  if(!id||!secret||!account) throw new Error('Zoom not connected')
  const data=await api(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(account)}`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`}})
  return data.access_token as string
}
async function googleToken() {
  const {GOOGLE_CALENDAR_CLIENT_ID:id,GOOGLE_CALENDAR_CLIENT_SECRET:secret,GOOGLE_CALENDAR_REFRESH_TOKEN:token}=process.env
  if(!id||!secret||!token) throw new Error('Google Calendar not connected')
  const data=await api('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:id,client_secret:secret,refresh_token:token,grant_type:'refresh_token'})})
  return data.access_token as string
}
const googleUrl=(id?:string)=>`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID||'primary')}/events${id?`/${encodeURIComponent(id)}`:''}`

// A reservation survives provider failure. No mock meeting URL or fake success.
export async function provisionBooking(id: string) {
  const db=createAdminClient()
  if(!db) return
  const {data:booking}=await db.from('class_bookings').select(`id,student_id,video_provider,status,class_sessions(${sessionFields})`).eq('id',id).maybeSingle()
  const session=Array.isArray(booking?.class_sessions)?booking.class_sessions[0]:booking?.class_sessions
  if(!booking||!session||booking.status!=='confirmed'||session.teacher_id!==process.env.CALENDAR_PROVIDER_TEACHER_ID) return
  const {data:student}=await db.from('profiles').select('email').eq('id',booking.student_id).maybeSingle()
  let url:string|null=null,meetingId:string|null=null,eventId:string|null=null
  try {
    if(booking.video_provider==='zoom') {
      const token=await zoomToken()
      const meeting=await api(`https://api.zoom.us/v2/users/${encodeURIComponent(process.env.ZOOM_HOST_USER_ID||'me')}/meetings`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({topic:session.title,type:2,start_time:session.starts_at,duration:Math.round((Date.parse(session.ends_at)-Date.parse(session.starts_at))/60000),timezone:'UTC',settings:{waiting_room:true,join_before_host:false}})})
      url=meeting.join_url;meetingId=String(meeting.id)
      await db.from('class_bookings').update({meeting_url:url,provider_meeting_id:meetingId,meeting_status:'ready'}).eq('id',id)
    }
    if(booking.video_provider==='google_meet'||process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      const token=await googleToken()
      const event=await api(`${googleUrl()}?conferenceDataVersion=1&sendUpdates=all`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({id:id.replaceAll('-',''),summary:session.title,description:url?`Join class: ${url}`:'Quanttoria maths class',start:{dateTime:session.starts_at},end:{dateTime:session.ends_at},...(student?.email?{attendees:[{email:student.email}]}:{}),...(booking.video_provider==='google_meet'?{conferenceData:{createRequest:{requestId:id,conferenceSolutionKey:{type:'hangoutsMeet'}}}}:{})})})
      eventId=event.id
      if(booking.video_provider==='google_meet') url=event.hangoutLink || event.conferenceData?.entryPoints?.find((e:{entryPointType:string})=>e.entryPointType==='video')?.uri || null
    }
    await db.from('class_bookings').update({meeting_url:url,provider_meeting_id:meetingId,calendar_event_id:eventId,meeting_status:url?'ready':'pending',calendar_status:eventId&&student?.email?'invited':'not_added'}).eq('id',id)
  } catch {
    // Zoom may have succeeded even if the invitation failed.
    await db.from('class_bookings').update({meeting_status:url?'ready':'failed',meeting_url:url,provider_meeting_id:meetingId,calendar_event_id:eventId}).eq('id',id)
  }
}
export async function removeBookingMeeting(id: string) {
  const db=createAdminClient()
  if(!db) return
  const {data:b}=await db.from('class_bookings').select('status,provider_meeting_id,calendar_event_id,class_sessions(teacher_id)').eq('id',id).maybeSingle()
  const s=Array.isArray(b?.class_sessions)?b.class_sessions[0]:b?.class_sessions
  if(!b||b.status!=='cancelled'||s?.teacher_id!==process.env.CALENDAR_PROVIDER_TEACHER_ID) return
  try {
    if(b.provider_meeting_id) await api(`https://api.zoom.us/v2/meetings/${encodeURIComponent(b.provider_meeting_id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${await zoomToken()}`}})
    if(b.calendar_event_id) await api(`${googleUrl(b.calendar_event_id)}?sendUpdates=all`,{method:'DELETE',headers:{Authorization:`Bearer ${await googleToken()}`}})
    await db.from('class_bookings').update({meeting_url:null,provider_meeting_id:null,calendar_event_id:null}).eq('id',id)
  } catch {
    // Identifiers are retained for operational reconciliation; no false success.
  }
}
