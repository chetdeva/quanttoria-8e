import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const root=new URL('../',import.meta.url)
registerHooks({
  resolve(specifier,context,nextResolve) {
    if(specifier==='@/lib/supabase/server') return {url:'data:text/javascript,export async function createClient(){return globalThis.calendarRouteDb}',shortCircuit:true}
    if(specifier==='@/lib/calendar/providers') return {url:'data:text/javascript,export async function provisionBooking(){if(globalThis.calendarProvisionFails)throw new Error("provider unavailable")} export async function removeBookingMeeting(){}',shortCircuit:true}
    if(specifier.startsWith('@/')) return nextResolve(new URL(`${specifier.slice(2)}.ts`,root).href,context)
    if(['./types','./ics','./booking-rules'].includes(specifier) && context.parentURL?.includes('/lib/calendar/')) return nextResolve(new URL(`${specifier}.ts`,context.parentURL).href,context)
    return nextResolve(specifier,context)
  },
  load(url,context,nextLoad) {
    if(url.startsWith(root.href)&&url.endsWith('.ts')) return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true}
    return nextLoad(url,context)
  },
})
const {POST}=await import('../app/api/calendar/bookings/route.ts')
const {DELETE}=await import('../app/api/calendar/bookings/[id]/route.ts')
const {GET:exportCalendar}=await import('../app/api/calendar/bookings/[id]/calendar/route.ts')
const {GET:loadCalendar}=await import('../app/api/calendar/route.ts')
const student='00000000-0000-0000-0000-000000000002',teacher='00000000-0000-0000-0000-000000000001'
const input={teacherId:teacher,startsAt:'2026-10-06T20:00:00Z',duration:60,classType:'regular',provider:'zoom',topic:''}
function setup({signedIn=true,role='student',rpcError=null,booking=null}={}) {
  const calls=[]
  globalThis.calendarRouteDb={
    auth:{getUser:async()=>({data:{user:signedIn?{id:student}:null}})},
    from(table){return {select(){return {
      eq(){return {maybeSingle:async()=>({data:table==='profiles'?{id:student,role}:booking,error:null})}},
    }}}},
    rpc:async(name,params)=>{calls.push({name,params});return {data:'booking',error:rpcError}},
  }
  globalThis.calendarProvisionFails=false
  return calls
}
const request=(body=input,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/calendar/bookings',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)})
test('confirmation handler returns 201 JSON and trusted student ID',async()=>{
  const calls=setup(),response=await POST(request())
  assert.equal(response.status,201);assert.deepEqual(await response.json(),{id:'booking'})
  assert.equal(calls[0].params.p_student,student)
})
test('provider failure cannot turn committed booking into an API error',async()=>{
  setup();globalThis.calendarProvisionFails=true
  const response=await POST(request());assert.equal(response.status,201);assert.equal((await response.json()).id,'booking')
})
test('reschedule handler sends replacement ID in the same reservation RPC',async()=>{
  const calls=setup(),replaceId='00000000-0000-0000-0000-000000000004'
  const response=await POST(request({...input,replaceId}))
  assert.equal(response.status,201);assert.equal(calls.length,1);assert.equal(calls[0].params.p_replace,replaceId)
})
test('booking contention returns 409 JSON',async()=>{
  setup({rpcError:{code:'23P01'}})
  const response=await POST(request());assert.equal(response.status,409);assert.match((await response.json()).error,/no longer available/)
})
test('all calendar endpoints return JSON 401 without a session',async()=>{
  setup({signedIn:false})
  const responses=await Promise.all([POST(request()),loadCalendar(new Request('http://localhost:3000/api/calendar')),DELETE(request(),{params:Promise.resolve({id:'booking'})}),exportCalendar(request(),{params:Promise.resolve({id:'booking'})})])
  for(const response of responses){assert.equal(response.status,401);assert.match((await response.json()).error,/sign in/)}
})
test('cross-origin mutations rejected before any reservation',async()=>{
  const calls=setup(),response=await POST(request(input,'https://evil.example'))
  assert.equal(response.status,403);assert.equal(calls.length,0)
})
test('invalid payloads/duration/provider cannot reach the database RPC',async()=>{
  for(const body of [null,[],{}, ...[0,14,16,181,45.5,'45',null].map(duration=>({...input,duration})), {...input,provider:'unknown'}, {...input,topic:'x'.repeat(2001)}]){
    const calls=setup(),response=await POST(request(body))
    assert.equal(response.status,400);assert.equal(calls.length,0);assert(response.headers.get('content-type').includes('application/json'))
  }
})
test('custom 45-minute booking reaches the reservation RPC',async()=>{
  const calls=setup(),response=await POST(request({...input,duration:45}))
  assert.equal(response.status,201);assert.equal(calls[0].params.p_minutes,45)
})
test('insufficient credits returns actionable JSON without a successful booking',async()=>{
  setup({rpcError:{code:'P0002'}})
  const response=await POST(request());assert.equal(response.status,400);assert.match((await response.json()).error,/Not enough credits/)
})
test('teacher cannot use student booking handler',async()=>{
  const calls=setup({role:'teacher'}),response=await POST(request())
  assert.equal(response.status,403);assert.equal(calls.length,0)
})
test('cancellation handler invokes authorized cancellation RPC',async()=>{
  const calls=setup(),response=await DELETE(request(),{params:Promise.resolve({id:'booking'})})
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{cancelled:true});assert.equal(calls[0].name,'calendar_cancel')
})
test('calendar export refuses an inaccessible booking',async()=>{
  setup();const response=await exportCalendar(request(),{params:Promise.resolve({id:'another-user-booking'})})
  assert.equal(response.status,404);assert.match((await response.json()).error,/not found/)
})
test('calendar export returns UTC ICS rather than JSON for authorized booking',async()=>{
  setup({booking:{id:'booking',status:'confirmed',topic:'Math',meeting_url:null,class_sessions:{title:'Math Class',starts_at:input.startsAt,ends_at:'2026-10-06T21:00:00Z'}}})
  const response=await exportCalendar(request(),{params:Promise.resolve({id:'booking'})})
  assert.equal(response.status,200);assert(response.headers.get('content-type').startsWith('text/calendar'));assert((await response.text()).includes('DTSTART:20261006T200000Z'))
})
