import type { Booking } from './types'
const escape=(s:string)=>s.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\r','')
const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
export function bookingIcs(booking:Booking) {
  const session=booking.class_sessions
  if(!session) throw new Error('Class not found')
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Quanttoria//Classes//EN','BEGIN:VEVENT',`UID:${booking.id}@quanttoria.com`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(session.starts_at)}`,`DTEND:${stamp(session.ends_at)}`,`SUMMARY:${escape(session.title)}`,`DESCRIPTION:${escape(booking.topic||'Math class')}`,`STATUS:${booking.status==='cancelled'?'CANCELLED':'CONFIRMED'}`,...(booking.meeting_url?[`URL:${escape(booking.meeting_url)}`]:[]),'END:VEVENT','END:VCALENDAR']
  return lines.join('\r\n')+'\r\n'
}
