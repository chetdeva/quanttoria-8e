-- Native booking APIs. Existing slots/bookings are preserved.
-- Stop rather than silently choosing winners for historical double bookings.
do $$ begin
  if exists(select 1 from public.class_bookings where status='confirmed' group by session_id having count(*)>1)
    then raise exception 'Resolve historical double bookings before applying native calendar'; end if;
end $$;
update public.class_sessions s set status='confirmed'
where status='open' and exists(select 1 from public.class_bookings b where b.session_id=s.id and b.status='confirmed');
create schema if not exists calendar_private;
revoke all on schema calendar_private from public;
grant usage on schema calendar_private to authenticated;

create table public.teacher_calendar_profiles (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  subject text not null default 'Math',
  grade_range text not null default 'Grades 6–8'
);
alter table public.teacher_calendar_profiles enable row level security;
grant select, insert, update on public.teacher_calendar_profiles to authenticated;
create policy calendar_profiles_read on public.teacher_calendar_profiles for select to authenticated using (true);
create policy calendar_profiles_insert on public.teacher_calendar_profiles for insert to authenticated
with check (teacher_id = (select auth.uid()) and exists(select 1 from public.profiles where id = auth.uid() and role = 'teacher'));
create policy calendar_profiles_update on public.teacher_calendar_profiles for update to authenticated
using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
insert into public.teacher_calendar_profiles(teacher_id, display_name)
select id, coalesce(nullif(full_name,''),'Math tutor') from public.profiles where role = 'teacher';

alter table public.class_bookings
  add column class_type text not null default 'regular' check (class_type in ('trial','regular')),
  add column video_provider text not null default 'zoom' check (video_provider in ('zoom','google_meet')),
  add column meeting_status text not null default 'pending' check (meeting_status in ('pending','ready','failed','unavailable')),
  add column calendar_status text not null default 'not_added' check (calendar_status in ('not_added','invited')),
  add column meeting_url text,
  add column provider_meeting_id text,
  add column calendar_event_id text;
-- Students must not forge confirmations, change ownership, or bypass locking.
revoke insert, update, delete on public.class_bookings from authenticated, anon;
create index calendar_teacher_time on public.class_sessions(teacher_id, starts_at, ends_at);
create index calendar_student_active on public.class_bookings(student_id, status);

create function calendar_private.reserve(
  p_teacher uuid, p_start timestamptz, p_minutes integer, p_class text,
  p_provider text, p_topic text, p_student uuid, p_replace uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  student uuid := coalesce(p_student,actor);
  finish timestamptz := p_start + make_interval(mins => p_minutes);
  source_window public.class_sessions%rowtype;
  old public.class_bookings%rowtype;
  old_session public.class_sessions%rowtype;
  slot_id uuid;
  booking_id uuid;
begin
  if actor is null or not exists(select 1 from public.profiles where id = student and role = 'student')
    or (actor <> student and not public.is_admin()) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_minutes not in (30,60) or p_class not in ('trial','regular') or p_provider not in ('zoom','google_meet')
    or p_start <= now() or p_start > now() + interval '90 days' or length(coalesce(p_topic,'')) > 2000
    or extract(second from p_start) <> 0 or extract(minute from p_start)::int % 15 <> 0
    then raise exception 'Invalid booking'; end if;
  if not exists(select 1 from public.profiles where id=p_teacher and role='teacher') then raise exception 'Unknown teacher'; end if;
  -- Stable lock order: student first, then teacher. Different teachers cannot
  -- double-book the same student; competing students serialize on the tutor.
  perform pg_advisory_xact_lock(hashtextextended(student::text, 1));
  perform pg_advisory_xact_lock(hashtextextended(p_teacher::text, 2));
  if p_replace is not null then
    select * into old from public.class_bookings where id=p_replace and student_id=student for update;
    if not found or old.status <> 'confirmed' then raise exception 'Booking cannot be rescheduled'; end if;
    select * into old_session from public.class_sessions where id=old.session_id;
    if old_session.teacher_id <> p_teacher or old_session.starts_at <= now() then raise exception 'Booking cannot be rescheduled'; end if;
  end if;
  if exists(select 1 from public.class_sessions s where s.teacher_id=p_teacher
    and s.status in ('confirmed','blocked') and s.id is distinct from old.session_id
    and s.starts_at < finish and s.ends_at > p_start)
    or exists(select 1 from public.class_bookings b join public.class_sessions s on s.id=b.session_id
    where b.student_id=student and b.status='confirmed' and b.id is distinct from p_replace
    and s.starts_at < finish and s.ends_at > p_start)
    then raise exception 'This time was just booked. Choose another slot.' using errcode='23P01'; end if;
  select * into source_window from public.class_sessions where teacher_id=p_teacher and status='open'
    and starts_at<=p_start and ends_at>=finish order by starts_at limit 1 for update;
  if source_window.id is null and not exists(
    select 1 from public.teacher_availability a where a.teacher_id=p_teacher and a.is_active
    and extract(dow from p_start at time zone a.timezone)=a.day_of_week
    and (p_start at time zone a.timezone)::date=(finish at time zone a.timezone)::date
    and (p_start at time zone a.timezone)::time>=a.start_time
    and (finish at time zone a.timezone)::time<=a.end_time
    -- Do not let a 60-minute class cross a DST wall-clock discontinuity.
    and (finish at time zone a.timezone)-(p_start at time zone a.timezone)=make_interval(mins=>p_minutes)
  ) then raise exception 'This time is no longer available' using errcode='23P01'; end if;
  if p_replace is not null then
    update public.class_bookings set status='cancelled',updated_at=now() where id=p_replace;
    update public.class_sessions set status='open' where id=old.session_id;
  end if;
  if source_window.id is not null then
    -- Split a published source_window, retaining any remaining bookable capacity.
    update public.class_sessions set status='cancelled' where id=source_window.id;
    insert into public.class_sessions(teacher_id,title,starts_at,ends_at,timezone,status)
    values(p_teacher,case when p_class='trial' then 'Trial Math Class' else 'Math Class' end,p_start,finish,source_window.timezone,'confirmed') returning id into slot_id;
    if source_window.starts_at < p_start then
      insert into public.class_sessions(teacher_id,title,starts_at,ends_at,timezone,status)
      values(p_teacher,source_window.title,source_window.starts_at,p_start,source_window.timezone,'open'); end if;
    if finish < source_window.ends_at then
      insert into public.class_sessions(teacher_id,title,starts_at,ends_at,timezone,status)
      values(p_teacher,source_window.title,finish,source_window.ends_at,source_window.timezone,'open'); end if;
  else
    insert into public.class_sessions(teacher_id,title,starts_at,ends_at,status)
    values(p_teacher,case when p_class='trial' then 'Trial Math Class' else 'Math Class' end,p_start,finish,'confirmed') returning id into slot_id;
  end if;
  insert into public.class_bookings(session_id,student_id,class_type,video_provider,topic)
  values(slot_id,student,p_class,p_provider,nullif(trim(p_topic),'')) returning id into booking_id;
  return booking_id;
end $$;
revoke all on function calendar_private.reserve(uuid,timestamptz,integer,text,text,text,uuid,uuid) from public,anon;
grant execute on function calendar_private.reserve(uuid,timestamptz,integer,text,text,text,uuid,uuid) to authenticated;
create function public.calendar_reserve(p_teacher uuid,p_start timestamptz,p_minutes integer,p_class text,p_provider text,p_topic text default '',p_student uuid default null,p_replace uuid default null)
returns uuid language sql security invoker set search_path='' as $$
select calendar_private.reserve(p_teacher,p_start,p_minutes,p_class,p_provider,p_topic,p_student,p_replace)
$$;
revoke all on function public.calendar_reserve(uuid,timestamptz,integer,text,text,text,uuid,uuid) from public,anon;
grant execute on function public.calendar_reserve(uuid,timestamptz,integer,text,text,text,uuid,uuid) to authenticated;

create function calendar_private.cancel(p_booking uuid) returns void language plpgsql security definer set search_path='' as $$
declare b public.class_bookings%rowtype; s public.class_sessions%rowtype;
begin
  select * into b from public.class_bookings where id=p_booking;
  select * into s from public.class_sessions where id=b.session_id;
  if auth.uid() is null or not found or (auth.uid()<>b.student_id and auth.uid()<>s.teacher_id and not public.is_admin())
    then raise exception 'Not authorized' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(b.student_id::text,1));
  perform pg_advisory_xact_lock(hashtextextended(s.teacher_id::text,2));
  select * into b from public.class_bookings where id=p_booking for update;
  if b.status='cancelled' then return; end if;
  if b.status<>'confirmed' or s.starts_at<=now() then raise exception 'Past classes cannot be cancelled'; end if;
  update public.class_bookings set status='cancelled',updated_at=now() where id=p_booking;
  update public.class_sessions set status='open' where id=b.session_id;
end $$;
revoke all on function calendar_private.cancel(uuid) from public,anon;
grant execute on function calendar_private.cancel(uuid) to authenticated;
create function public.calendar_cancel(p_booking uuid) returns void language sql security invoker set search_path='' as $$select calendar_private.cancel(p_booking)$$;
revoke all on function public.calendar_cancel(uuid) from public,anon;
grant execute on function public.calendar_cancel(uuid) to authenticated;

-- Expose only participant display names, never the profile directory or email.
create function calendar_private.students(p_teacher uuid) returns table(session_id uuid,student_name text)
language sql security definer set search_path='' as $$
select b.session_id,coalesce(p.full_name,'Student') from public.class_bookings b
join public.class_sessions s on s.id=b.session_id join public.profiles p on p.id=b.student_id
where s.teacher_id=p_teacher and b.status='confirmed' and (auth.uid()=p_teacher or public.is_admin())
$$;
revoke all on function calendar_private.students(uuid) from public,anon;
grant execute on function calendar_private.students(uuid) to authenticated;
create function public.calendar_students(p_teacher uuid) returns table(session_id uuid,student_name text)
language sql security invoker set search_path='' as $$select * from calendar_private.students(p_teacher)$$;
revoke all on function public.calendar_students(uuid) from public,anon;
grant execute on function public.calendar_students(uuid) to authenticated;

create function calendar_private.complete(p_session uuid) returns void language plpgsql security definer set search_path='' as $$
declare s public.class_sessions%rowtype;
begin
  select * into s from public.class_sessions where id=p_session;
  if auth.uid() is null or not found or (auth.uid()<>s.teacher_id and not public.is_admin())
    then raise exception 'Not authorized' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.teacher_id::text,2));
  select * into s from public.class_sessions where id=p_session for update;
  if s.ends_at>now() or s.status<>'confirmed' then raise exception 'Only ended classes can be completed'; end if;
  update public.class_sessions set status='completed' where id=p_session;
  update public.class_bookings set status='completed',updated_at=now() where session_id=p_session and status='confirmed';
end $$;
revoke all on function calendar_private.complete(uuid) from public,anon;
grant execute on function calendar_private.complete(uuid) to authenticated;
create function public.calendar_complete(p_session uuid) returns void language sql security invoker set search_path='' as $$select calendar_private.complete(p_session)$$;
revoke all on function public.calendar_complete(uuid) from public,anon;
grant execute on function public.calendar_complete(uuid) to authenticated;

create function calendar_private.guard_schedule() returns trigger language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.teacher_id::text,2));
  if current_user='authenticated' then
    if new.status='confirmed' then raise exception 'Use the booking API to confirm classes'; end if;
    if tg_op='UPDATE' and exists(select 1 from public.class_bookings where session_id=old.id and status='confirmed')
      and (new.starts_at<>old.starts_at or new.ends_at<>old.ends_at or new.teacher_id<>old.teacher_id or new.status<>old.status)
      then raise exception 'Cancel or reschedule the booking before changing this class'; end if;
    if new.status not in ('cancelled','completed') and exists(select 1 from public.class_sessions s
      where s.teacher_id=new.teacher_id and s.id<>new.id and s.status in ('confirmed','blocked')
      and s.starts_at<new.ends_at and s.ends_at>new.starts_at)
      then raise exception 'This time overlaps another class'; end if;
  end if;
  return new;
end $$;
revoke all on function calendar_private.guard_schedule() from public,anon,authenticated;
create trigger calendar_schedule_guard before insert or update on public.class_sessions
for each row execute function calendar_private.guard_schedule();
