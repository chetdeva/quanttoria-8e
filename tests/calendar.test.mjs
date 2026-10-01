import test from 'node:test'
import assert from 'node:assert/strict'
import { availableSlots, dayInZone, groupBookings, timeInZone } from '../lib/calendar/time.ts'
import { bookingIcs } from '../lib/calendar/ics.ts'
import { validDuration, requiredCredits, joinLink } from '../lib/calendar/booking-rules.ts'

const teacher='teacher'
const zone='America/New_York'
const hours=(day,start,end)=>[{id:'hours',teacher_id:teacher,day_of_week:day,start_time:start,end_time:end,timezone:zone,is_active:true}]
const session=(start,end,status='confirmed')=>({id:start,teacher_id:teacher,title:'Math',starts_at:start,ends_at:end,status,topic:null,notes:null})
test('custom durations and prorated credits share a validated rule',()=>{
  for(const duration of [15,30,45,60,90,180]){assert(validDuration(duration));assert.equal(requiredCredits(duration),duration/60)}
  for(const duration of [0,14,16,181,30.5,NaN,'60',null]) assert(!validDuration(duration))
})
test('ongoing 5:15 PM class joins with a real HTTPS URL even with stale pending status',()=>{
  const booking={status:'confirmed',meeting_status:'pending',meeting_url:'https://zoom.us/j/123',class_sessions:session('2026-10-01T11:45:00Z','2026-10-01T12:45:00Z')}
  assert.equal(joinLink(booking,Date.parse('2026-10-01T12:12:00Z')),booking.meeting_url)
  assert.equal(joinLink({...booking,meeting_url:null},Date.parse('2026-10-01T12:12:00Z')),null)
  assert.equal(joinLink(booking,Date.parse('2026-10-01T12:45:00Z')),null)
  assert.equal(joinLink({...booking,status:'cancelled'},0),null)
  for(const meeting_url of ['javascript:alert(1)','http://zoom.us/j/123','https://user:password@zoom.us/j/123','https://']) assert.equal(joinLink({...booking,meeting_url},0),null)
})
test('45-minute custom slots fit available windows and exclude occupied time',()=>{
  const slots=availableSlots([session('2026-10-06T20:00:00Z','2026-10-06T21:00:00Z','open')],[],teacher,'2026-10-06',zone,45,0)
  assert.equal(slots.length,2);assert.equal(Date.parse(slots[0].ends_at)-Date.parse(slots[0].starts_at),45*60000)
  assert.equal(availableSlots([],hours(2,'16:00','17:00'),teacher,'2026-10-06',zone,16,0).length,0)
})
test('spring DST skips nonexistent hours and never crosses the wall-clock jump',()=>{
  const slots=availableSlots([],hours(0,'01:00','04:00'),teacher,'2026-03-08',zone,60,0)
  assert(slots.length>0)
  assert(slots.every(s=>!timeInZone(s.starts_at,zone).startsWith('2:')))
  assert(!slots.some(s=>s.starts_at==='2026-03-08T06:30:00.000Z'))
  assert(slots.some(s=>s.starts_at==='2026-03-08T07:00:00.000Z'))
})
test('fall DST distinguishes both 1 AM occurrences by offset abbreviation',()=>{
  const slots=availableSlots([],hours(0,'01:00','03:00'),teacher,'2026-11-01',zone,30,0)
  assert(slots.some(s=>s.starts_at==='2026-11-01T05:00:00.000Z'))
  assert(slots.some(s=>s.starts_at==='2026-11-01T06:00:00.000Z'))
  assert.notEqual(timeInZone('2026-11-01T05:00:00Z',zone),timeInZone('2026-11-01T06:00:00Z',zone))
})
test('confirmed/blocked bookings remove overlaps but allow adjacent classes',()=>{
  const sessions=[session('2026-10-06T20:00:00Z','2026-10-06T21:00:00Z','open'),session('2026-10-06T20:00:00Z','2026-10-06T20:30:00Z')]
  const slots=availableSlots(sessions,[],teacher,'2026-10-06',zone,30,0)
  assert.deepEqual(slots.map(s=>s.starts_at),['2026-10-06T20:30:00.000Z'])
  assert.equal(availableSlots(sessions,[],teacher,'2026-10-06',zone,60,0).length,0)
})
test('cancelled classes do not occupy weekly availability',()=>{
  const slots=availableSlots([session('2026-10-06T20:00:00Z','2026-10-06T21:00:00Z','cancelled')],hours(2,'16:00','17:00'),teacher,'2026-10-06',zone,60,0)
  assert.equal(slots.length,1)
})
test('display timezone changes date without changing the instant',()=>{
  assert.equal(dayInZone('2026-10-07T00:00:00Z',zone),'2026-10-06')
  assert.equal(dayInZone('2026-10-07T00:00:00Z','Asia/Kolkata'),'2026-10-07')
})
test('ICS uses UTC instants, stable UID and escapes user input',()=>{
  const booking={id:'booking',status:'confirmed',topic:'Fractions\nBEGIN:VEVENT',meeting_url:'https://zoom.us/j/example',class_sessions:session('2026-10-06T20:00:00Z','2026-10-06T21:00:00Z')}
  const ics=bookingIcs(booking)
  assert(ics.includes('DTSTART:20261006T200000Z'))
  assert(ics.includes('UID:booking@quanttoria.com'))
  assert(ics.includes('DESCRIPTION:Fractions\\nBEGIN:VEVENT'))
  assert.equal(ics.match(/\r\nBEGIN:VEVENT/g).length,1)
})
test('agenda groups today, upcoming and history in the selected timezone',()=>{
  const booking=(id,start,status='confirmed')=>({id,status,class_sessions:session(start,new Date(Date.parse(start)+3600000).toISOString())})
  const data=[booking('later','2026-10-07T20:00:00Z'),booking('today','2026-10-07T00:00:00Z'),booking('past','2026-10-05T20:00:00Z'),booking('cancelled','2026-10-08T20:00:00Z','cancelled'),{id:'missing',status:'confirmed',class_sessions:null}]
  const groups=groupBookings(data,zone,Date.parse('2026-10-06T19:00:00Z'))
  assert.deepEqual(groups.today.map(b=>b.id),['today'])
  assert.deepEqual(groups.upcoming.map(b=>b.id),['later'])
  assert.deepEqual(groups.history.map(b=>b.id),['cancelled','past'])
  assert.deepEqual(groupBookings(data,'Asia/Kolkata',Date.parse('2026-10-06T19:00:00Z')).today.map(b=>b.id),['today'])
})
test('agenda sorts classes chronologically without mutating API data',()=>{
  const data=['2026-10-08T20:00:00Z','2026-10-07T20:00:00Z'].map((start,id)=>({id:String(id),status:'confirmed',class_sessions:session(start,new Date(Date.parse(start)+3600000).toISOString())}))
  const groups=groupBookings(data,zone,Date.parse('2026-10-06T19:00:00Z'))
  assert.deepEqual(groups.upcoming.map(b=>b.id),['1','0'])
  assert.deepEqual(data.map(b=>b.id),['0','1'])
})
