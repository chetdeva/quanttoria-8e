// Run with PGLITE_MODULE pointing to an isolated @electric-sql/pglite install.
// This fixture never connects to the hosted Supabase database.
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
await db.exec(`
create role anon; create role authenticated;
create schema auth;
grant usage on schema auth to authenticated,anon;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.profiles(id uuid primary key,full_name text,role text,email text);
create function public.is_admin() returns boolean language sql as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
create table public.teacher_availability(id uuid primary key default gen_random_uuid(),teacher_id uuid references public.profiles(id),day_of_week integer,start_time time,end_time time,timezone text,is_active boolean);
create table public.class_sessions(id uuid primary key default gen_random_uuid(),teacher_id uuid references public.profiles(id),title text,starts_at timestamptz,ends_at timestamptz,timezone text default 'UTC',status text default 'open',topic text,notes text);
create table public.class_bookings(id uuid primary key default gen_random_uuid(),session_id uuid references public.class_sessions(id),student_id uuid references public.profiles(id),status text default 'confirmed',topic text,notes text,credits_used integer not null default 1 check(credits_used>0),created_at timestamptz default now(),updated_at timestamptz default now(),unique(session_id,student_id));
insert into public.profiles(id,full_name,role) values('00000000-0000-0000-0000-000000000001','Teacher','teacher'),('00000000-0000-0000-0000-000000000002','Alice','student'),('00000000-0000-0000-0000-000000000003','James','student');
`)
await db.exec(await readFile(new URL('../supabase/migrations/20261001110024_native_calendar_booking.sql',import.meta.url),'utf8'))
await db.exec(await readFile(new URL('../supabase/migrations/20261001123257_calendar_duration_credits.sql',import.meta.url),'utf8'))
await db.query(`insert into student_calendar_credits(student_id,balance_minutes) values('00000000-0000-0000-0000-000000000002',240),('00000000-0000-0000-0000-000000000003',120)`)
const balance=async()=>Number((await db.query(`select balance_minutes from student_calendar_credits where student_id=auth.uid()`)).rows[0].balance_minutes)
const tomorrow = new Date(Date.now()+86400000); tomorrow.setUTCHours(16,0,0,0)
const starts = tomorrow.toISOString()
const later = new Date(+tomorrow+3600000).toISOString()
const end = new Date(+tomorrow+3*3600000).toISOString()
await db.query(`insert into class_sessions(teacher_id,title,starts_at,ends_at,status) values('00000000-0000-0000-0000-000000000001','Window',$1,$2,'open')`,[starts,end])
await db.query(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`)
const reserve=async(start,replace=null)=> (await db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,60,'regular','zoom','',null,$2) as id`,[start,replace])).rows[0].id
const alice=await reserve(starts)
assert.equal(await balance(),180)
await db.query(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false)`)
await assert.rejects(()=>reserve(starts),/just booked/)
const james=await reserve(later)
await assert.rejects(()=>db.query(`select calendar_cancel($1)`,[alice]),/Not authorized/)
await db.query(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`)
await assert.rejects(()=>reserve(later,alice),/just booked/)
assert.equal(await balance(),180)
assert.equal((await db.query('select status from class_bookings where id=$1',[alice])).rows[0].status,'confirmed')
const third=new Date(+tomorrow+2*3600000).toISOString()
const rescheduled=await reserve(third,alice)
assert.equal(await balance(),180)
assert.equal((await db.query('select status from class_bookings where id=$1',[alice])).rows[0].status,'cancelled')
await db.query(`select calendar_cancel($1)`,[rescheduled])
assert.equal(await balance(),240)
await db.query(`select calendar_cancel($1)`,[rescheduled])
assert.equal(await balance(),240)
const rebooked=await reserve(third)
assert.equal(await balance(),180)
assert.notEqual(rebooked,rescheduled)
assert.equal((await db.query(`select has_function_privilege('anon','calendar_reserve(uuid,timestamptz,integer,text,text,text,uuid,uuid)','execute') as allowed`)).rows[0].allowed,false)
assert.equal((await db.query(`select has_table_privilege('authenticated','class_bookings','insert') as allowed`)).rows[0].allowed,false)
await db.query(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)`)
const enrolled=await db.query(`select * from calendar_students('00000000-0000-0000-0000-000000000001')`)
assert(enrolled.rows.some(row=>row.student_name==='Alice'))
assert(enrolled.rows.some(row=>row.student_name==='James'))
await db.query(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)`)
const nextDay=new Date(+tomorrow+86400000)
await db.query(`insert into teacher_availability(teacher_id,day_of_week,start_time,end_time,timezone,is_active) values('00000000-0000-0000-0000-000000000001',$1,'09:00','17:00','America/New_York',true)`,[nextDay.getUTCDay()])
const trial=(await db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,30,'trial','google_meet','Fractions') as id`,[nextDay.toISOString()])).rows[0].id
const trialBooking=(await db.query('select class_type,video_provider,status from class_bookings where id=$1',[trial])).rows[0]
assert.deepEqual(trialBooking,{class_type:'trial',video_provider:'google_meet',status:'confirmed'})
assert.equal(await balance(),150)
const customStart=new Date(+nextDay+3600000).toISOString()
const custom=(await db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,45,'regular','zoom','') as id`,[customStart])).rows[0].id
assert.equal(await balance(),105)
assert.equal(Number((await db.query('select credits_used from class_bookings where id=$1',[custom])).rows[0].credits_used),0.75)
await assert.rejects(()=>db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,16,'trial','zoom','')`,[nextDay.toISOString()]),/Invalid booking/)
const beforeCount=Number((await db.query('select count(*) from class_bookings')).rows[0].count)
await assert.rejects(()=>db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,120,'regular','zoom','')`,[new Date(+nextDay+2*3600000).toISOString()]),/Not enough credits/)
assert.equal(await balance(),105)
assert.equal(Number((await db.query('select count(*) from class_bookings')).rows[0].count),beforeCount)
const longer=(await db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,60,'regular','zoom','',null,$2) as id`,[new Date(+nextDay+3*3600000).toISOString(),custom])).rows[0].id
assert.equal(await balance(),90)
await db.query(`select calendar_cancel($1)`,[longer])
assert.equal(await balance(),150)
// Historical bookings were never debited: cancelling one must not mint credits.
await db.query(`update class_bookings set credits_charged=false where id=$1`,[trial])
await db.query(`select calendar_cancel($1)`,[trial])
assert.equal(await balance(),150)
assert.equal((await db.query(`select has_table_privilege('authenticated','student_calendar_credits','update') as allowed`)).rows[0].allowed,false)
await db.query(`grant select on profiles to authenticated`)
await db.query(`set role authenticated`)
const ownWallets=(await db.query(`select student_id from student_calendar_credits`)).rows
assert.deepEqual(ownWallets,[{student_id:'00000000-0000-0000-0000-000000000002'}])
await assert.rejects(()=>db.query(`update student_calendar_credits set balance_minutes=9999`),/permission denied/)
await db.query(`reset role`)
await db.query(`set role anon`)
await assert.rejects(()=>db.query(`select * from student_calendar_credits`),/permission denied/)
await db.query(`reset role`)
await assert.rejects(()=>db.query(`select calendar_reserve('00000000-0000-0000-0000-000000000001',$1,30,'trial','zoom','', '00000000-0000-0000-0000-000000000003')`,[nextDay.toISOString()]),/Not authorized/)
await db.query(`select set_config('request.jwt.claim.sub','',false)`)
await assert.rejects(()=>reserve(starts),/Not authorized/)
console.log('PASS: migration, competing reservations, adjacent slots, authorization, atomic reschedule, cancellation, rebooking, credit debits/refunds, no double refunds, insufficient-credit rollback, fractional/custom durations, credit write guards, teacher student names, recurring hours, both providers, invalid input')
await db.close()
