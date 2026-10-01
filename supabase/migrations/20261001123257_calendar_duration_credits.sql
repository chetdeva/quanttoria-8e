-- 1 credit = 60 minutes. Integer minutes avoid fractional rounding.
-- Existing bookings are NOT retroactively charged or refunded.
create table public.student_calendar_credits (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  balance_minutes integer not null default 0 check (balance_minutes >= 0),
  updated_at timestamptz not null default now()
);
alter table public.student_calendar_credits enable row level security;
revoke all on public.student_calendar_credits from public,anon,authenticated;
grant select on public.student_calendar_credits to authenticated;
create policy student_credit_read on public.student_calendar_credits for select to authenticated
using (student_id=(select auth.uid()) or public.is_admin());
-- Credit grants are a trusted administrative operation; never browser-writable.
alter table public.class_bookings alter column credits_used type numeric using credits_used::numeric;
alter table public.class_bookings add column credits_charged boolean not null default false;
create or replace function calendar_private.reserve(
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
  refund_minutes integer := 0;
  balance integer;
begin
  if actor is null or not exists(select 1 from public.profiles where id = student and role = 'student')
    or (actor <> student and not public.is_admin()) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_minutes is null or p_minutes < 15 or p_minutes > 180 or p_minutes % 15 <> 0 or p_class not in ('trial','regular') or p_provider not in ('zoom','google_meet')
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
  if old.credits_charged then refund_minutes := (old.credits_used*60)::integer; end if;
  insert into public.student_calendar_credits(student_id) values(student) on conflict do nothing;
  select balance_minutes into balance from public.student_calendar_credits where student_id=student for update;
  if balance + refund_minutes < p_minutes then raise exception 'Not enough credits' using errcode='P0002'; end if;
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
    update public.class_bookings set status='cancelled',credits_charged=false,updated_at=now() where id=p_replace;
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
  insert into public.class_bookings(session_id,student_id,class_type,video_provider,topic,credits_used,credits_charged)
  values(slot_id,student,p_class,p_provider,nullif(trim(p_topic),''),p_minutes/60.0,true) returning id into booking_id;
  update public.student_calendar_credits set balance_minutes=balance_minutes+refund_minutes-p_minutes,updated_at=now() where student_id=student;
  return booking_id;
end $$;

create or replace function calendar_private.cancel(p_booking uuid) returns void language plpgsql security definer set search_path='' as $$
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
  if b.credits_charged then
    update public.student_calendar_credits set balance_minutes=balance_minutes+(b.credits_used*60)::integer,updated_at=now() where student_id=b.student_id;
  end if;
  update public.class_bookings set status='cancelled',credits_charged=false,updated_at=now() where id=p_booking;
  update public.class_sessions set status='open' where id=b.session_id;
end $$;
