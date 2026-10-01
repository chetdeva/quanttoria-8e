import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarRequest } from '../lib/calendar/client.ts'

async function withResponse(response, run) {
  const original=globalThis.fetch
  globalThis.fetch=async()=>response
  try { await run() } finally { globalThis.fetch=original }
}
test('booking confirmation parses a successful JSON response',async()=>{
  await withResponse(Response.json({id:'booking'},{status:201}),async()=>assert.deepEqual(await calendarRequest('/bookings'),{id:'booking'}))
})
test('HTML 404 produces actionable booking error, not JSON SyntaxError',async()=>{
  await withResponse(new Response('<!DOCTYPE html><h1>404</h1>',{status:404,headers:{'Content-Type':'text/html'}}),async()=>assert.rejects(()=>calendarRequest('/bookings'),/booking service is unavailable/))
})
test('HTML 500 does not parse markup or encourage blind retries',async()=>{
  await withResponse(new Response('<!DOCTYPE html>',{status:500,headers:{'Content-Type':'text/html'}}),async()=>assert.rejects(()=>calendarRequest('/bookings'),/Refresh your classes/))
})
test('expired authentication displays the API message',async()=>{
  await withResponse(Response.json({error:'Please sign in to use the calendar.'},{status:401}),async()=>assert.rejects(()=>calendarRequest('/bookings'),/Please sign in/))
})
test('competing booking displays conflict response',async()=>{
  await withResponse(Response.json({error:'This time is no longer available. Choose another slot.'},{status:409}),async()=>assert.rejects(()=>calendarRequest('/bookings'),/no longer available/))
})
test('malformed JSON produces a safe error',async()=>{
  await withResponse(new Response('{',{headers:{'Content-Type':'application/json'}}),async()=>assert.rejects(()=>calendarRequest('/bookings'),/invalid response/))
})
test('null JSON is rejected rather than causing an unhelpful property error',async()=>{
  await withResponse(Response.json(null),async()=>assert.rejects(()=>calendarRequest('/bookings'),/invalid response/))
})
