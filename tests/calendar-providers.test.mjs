import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// Replace ONLY server-only boundary/database in this Node test process.
// Real native-provider request building and lifecycle code are exercised.
const hooks=registerHooks({resolve(specifier,context,nextResolve){
  if(specifier==='server-only') return {url:'data:text/javascript,export {}',shortCircuit:true}
  if(specifier==='@/lib/supabase/admin') return {url:'data:text/javascript,export function createAdminClient(){return globalThis.calendarTestDb}',shortCircuit:true}
  if(specifier==='./types' && context.parentURL?.endsWith('/calendar/providers.ts')) return nextResolve(new URL('../lib/calendar/types.ts',import.meta.url).href,context)
  return nextResolve(specifier,context)
}})
const {provisionBooking,removeBookingMeeting}=await import('../lib/calendar/providers.ts')
const id='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const session={teacher_id:'teacher',title:'Math Class',starts_at:'2026-10-06T20:00:00Z',ends_at:'2026-10-06T21:00:00Z'}
async function fixture(provider,requests,run,extra={}) {
  const writes=[],calls=[],oldFetch=globalThis.fetch
  const variables={CALENDAR_PROVIDER_TEACHER_ID:'teacher',ZOOM_CLIENT_ID:'test',ZOOM_CLIENT_SECRET:'test',ZOOM_ACCOUNT_ID:'test',ZOOM_HOST_USER_ID:'host',GOOGLE_CALENDAR_CLIENT_ID:'test',GOOGLE_CALENDAR_CLIENT_SECRET:'test',GOOGLE_CALENDAR_REFRESH_TOKEN:'test',GOOGLE_CALENDAR_ID:'test-calendar'}
  const oldEnv=Object.fromEntries(Object.keys(variables).map(k=>[k,process.env[k]]))
  Object.assign(process.env,variables)
  const booking={id,student_id:'student',video_provider:provider,status:'confirmed',class_sessions:session,...extra}
  globalThis.calendarTestDb={from(table){return {
    select(){return {eq(){return {maybeSingle:async()=>({data:table==='profiles'?{email:'student@example.test'}:booking})}}}},
    update(values){return {eq:async()=>{writes.push(values);return {error:null}}}},
  }}}
  globalThis.fetch=async(url,init)=>{
    calls.push({url,init})
    const response=requests.shift()
    if(response instanceof Error) throw response
    assert(response,'Unexpected provider request')
    return response
  }
  try {await run({writes,calls})} finally {
    globalThis.fetch=oldFetch;delete globalThis.calendarTestDb
    for(const [key,value] of Object.entries(oldEnv)) {if(value===undefined)delete process.env[key];else process.env[key]=value}
  }
}
const token=()=>Response.json({access_token:'test-token'})
test('Zoom booking creates 60-minute meeting and sends Google invitation',async()=>{
  await fixture('zoom',[token(),Response.json({id:123,join_url:'https://zoom.us/j/test'}),token(),Response.json({id:'event'})],async({writes,calls})=>{
    await provisionBooking(id)
    const meeting=JSON.parse(calls[1].init.body)
    assert.equal(meeting.duration,60);assert.equal(meeting.start_time,session.starts_at)
    assert.equal(meeting.settings.waiting_room,true)
    assert.equal(writes.at(-1).meeting_status,'ready');assert.equal(writes.at(-1).calendar_status,'invited')
  })
})
test('Google Meet booking requests a native conference and stores join URL',async()=>{
  await fixture('google_meet',[token(),Response.json({id:'event',hangoutLink:'https://meet.google.com/test'})],async({writes,calls})=>{
    await provisionBooking(id)
    assert(calls[1].url.includes('conferenceDataVersion=1&sendUpdates=all'))
    const event=JSON.parse(calls[1].init.body)
    assert.equal(event.conferenceData.createRequest.conferenceSolutionKey.type,'hangoutsMeet')
    assert.equal(event.attendees[0].email,'student@example.test')
    assert.equal(writes.at(-1).meeting_url,'https://meet.google.com/test')
  })
})
test('asynchronous Google conference creation remains pending, not falsely ready',async()=>{
  await fixture('google_meet',[token(),Response.json({id:'event',conferenceData:{createRequest:{status:{statusCode:'pending'}}}})],async({writes})=>{
    await provisionBooking(id);assert.equal(writes.at(-1).meeting_status,'pending');assert.equal(writes.at(-1).meeting_url,null)
  })
})
test('provider outage never produces a fake join link or success status',async()=>{
  await fixture('google_meet',[new Error('Provider outage')],async({writes})=>{
    await provisionBooking(id);assert.equal(writes.at(-1).meeting_status,'failed');assert.equal(writes.at(-1).meeting_url,null)
  })
})
test('Zoom success is retained when calendar invitation fails',async()=>{
  await fixture('zoom',[token(),Response.json({id:123,join_url:'https://zoom.us/j/test'}),new Error('Calendar outage')],async({writes})=>{
    await provisionBooking(id);assert.equal(writes.at(-1).meeting_status,'ready');assert.equal(writes.at(-1).provider_meeting_id,'123')
  })
})
test('cancelled booking deletes both provider resources and clears identifiers',async()=>{
  await fixture('zoom',[token(),new Response(null,{status:204}),token(),new Response(null,{status:204})],async({writes,calls})=>{
    await removeBookingMeeting(id)
    assert.equal(calls[1].init.method,'DELETE');assert.equal(calls[3].init.method,'DELETE')
    assert.deepEqual(writes.at(-1),{meeting_url:null,provider_meeting_id:null,calendar_event_id:null})
  },{status:'cancelled',provider_meeting_id:'123',calendar_event_id:'event'})
})
test('teacher credential binding prevents another tutor using hosted credentials',async()=>{
  await fixture('zoom',[],async({writes,calls})=>{await provisionBooking(id);assert.equal(calls.length,0);assert.equal(writes.length,0)}, {class_sessions:{...session,teacher_id:'another-teacher'}})
})
test('missing service credentials leaves meeting pending without external calls',async()=>{
  await fixture('zoom',[],async({calls})=>{globalThis.calendarTestDb=null;await provisionBooking(id);assert.equal(calls.length,0)})
})
test('failed cleanup retains resource IDs for reconciliation',async()=>{
  await fixture('zoom',[new Error('Outage')],async({writes})=>{await removeBookingMeeting(id);assert.equal(writes.length,0)}, {status:'cancelled',provider_meeting_id:'123',calendar_event_id:'event'})
})
