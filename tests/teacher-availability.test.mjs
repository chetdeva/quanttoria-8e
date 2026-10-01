import test from 'node:test'
import assert from 'node:assert/strict'
import { availabilityEnd, weeklyAvailability, weekdays } from '../lib/calendar/teacher-availability.ts'
import { availableSlots } from '../lib/calendar/time.ts'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

registerHooks({resolve(specifier,context,nextResolve){
  if(specifier==='@/lib/supabase/client') return {url:'data:text/javascript,export function createClient(){return globalThis.teacherAvailabilityDb}',shortCircuit:true}
  if(['./types','./teacher-availability'].includes(specifier)&&context.parentURL?.includes('/lib/calendar/')) return nextResolve(new URL(`${specifier}.ts`,context.parentURL).href,context)
  return nextResolve(specifier,context)
},load(url,context,nextLoad){
  if(url.endsWith('/components/calendar-duration.tsx')) return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true}
  return nextLoad(url,context)
}})
const { createTeacherRepository } = await import('../lib/calendar/teacher-repository.ts')
const { CalendarDuration } = await import('../components/calendar-duration.tsx')

const start='2026-10-05T09:00',end='2026-10-05T09:30'
test('availability defaults to 30 minutes and supports custom hour durations',()=>{
  assert.equal(availabilityEnd(start,30),end)
  assert.equal(availabilityEnd(start,150),'2026-10-05T11:30')
  assert.equal(availabilityEnd('2026-03-08T01:30',60),'2026-03-08T02:30')
  for(const duration of [0,14,16,NaN,1441]) assert.equal(availabilityEnd(start,duration),'')
})
test('shared duration control renders presets and custom minutes with 15-minute steps',()=>{
  const preset=renderToStaticMarkup(createElement(CalendarDuration,{value:30,onChange:()=>{}}))
  assert(preset.includes('30 min')&&preset.includes('60 min')&&preset.includes('Custom'))
  assert(!preset.includes('Duration in minutes'))
  const custom=renderToStaticMarkup(createElement(CalendarDuration,{value:45,max:1440,onChange:()=>{},disabled:true}))
  assert(custom.includes('Duration in minutes'))
  assert(custom.includes('step="15"')&&custom.includes('max="1440"')&&custom.includes('value="45"'))
  assert(custom.includes('<fieldset disabled=""'))
})
test('every day publishes all seven weekdays and individual removal leaves six',()=>{
  const allDays=weekdays.map(day=>day.value)
  assert.equal(weeklyAvailability('teacher',allDays,start,end,'UTC',[]).length,7)
  const withoutSunday=allDays.filter(day=>day!==0)
  assert(!weekdays.every(day=>withoutSunday.includes(day.value)))
  assert.equal(weeklyAvailability('teacher',withoutSunday,start,end,'UTC',[]).length,6)
})
test('weekday choices include Monday through Sunday with native database numbers',()=>{
  assert.deepEqual(weekdays.map(day=>day.value),[1,2,3,4,5,6,0])
})
test('multiple selected weekdays publish the same range in the teacher timezone',()=>{
  const rows=weeklyAvailability('teacher',[1,3,5,0,1],start,end,'America/New_York',[])
  assert.deepEqual(rows.map(row=>row.day_of_week),[1,3,5,0])
  assert(rows.every(row=>row.start_time==='09:00'&&row.end_time==='09:30'&&row.timezone==='America/New_York'))
  assert.equal(availableSlots([],rows,'teacher','2026-10-05','America/New_York',30,0).length,1)
  assert.equal(availableSlots([],rows,'teacher','2026-10-06','America/New_York',30,0).length,0)
})
test('publishing preserves other windows and skips exact active duplicates',()=>{
  const existing=[{teacher_id:'teacher',day_of_week:1,start_time:'09:00:00',end_time:'09:30:00',timezone:'America/New_York',is_active:true}]
  assert.deepEqual(weeklyAvailability('teacher',[1,2],start,end,'America/New_York',existing).map(row=>row.day_of_week),[2])
  assert.equal(weeklyAvailability('teacher',[1],start,'2026-10-05T10:00','America/New_York',existing).length,1)
  assert.equal(existing[0].end_time,'09:30:00')
})
test('weekly rules require selected valid days and reject midnight crossing',()=>{
  for(const days of [[],[-1],[7],[1.5]]) assert.throws(()=>weeklyAvailability('teacher',days,start,end,'UTC',[]),/weekday/)
  assert.throws(()=>weeklyAvailability('teacher',[1],start,'2026-10-06T09:30','UTC',[]),/same day/)
  assert.throws(()=>weeklyAvailability('teacher',[1],end,start,'UTC',[]),/same day/)
})
test('repository publishes all weekdays in a single insert rather than partial writes',async()=>{
  const writes=[]
  globalThis.teacherAvailabilityDb={from(table){assert.equal(table,'teacher_availability');return {insert(rows){writes.push(rows);return {select:async()=>({data:rows.map((_,i)=>({id:String(i)})),error:null})}}}}}
  const result=await createTeacherRepository().saveWeeklyHours('teacher',[1,2,3],start,end,'UTC',[])
  assert.equal(writes.length,1);assert.equal(writes[0].length,3);assert.equal(result.data.length,3)
})
test('repository avoids writes when all selected hours already exist',async()=>{
  globalThis.teacherAvailabilityDb={from(){throw new Error('Unexpected duplicate write')}}
  const existing=weeklyAvailability('teacher',[1],start,end,'UTC',[])
  const result=await createTeacherRepository().saveWeeklyHours('teacher',[1],start,end,'UTC',existing)
  assert.equal(result.error,null);assert.equal(result.data.length,1)
})
