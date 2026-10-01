# Native calendar booking

## Design

The app owns availability and reservations in Supabase. No Cal.com or cal.diy
service is required. `lib/calendar` contains types, timezone/slot calculations,
database access, provider adapters and the browser API client. Thin App Router
handlers live at `/api/calendar`.

Students select a teacher, trial/regular class, 30/60 minutes, date, time and
Zoom/Google Meet. Weekly teacher hours and dated open windows are both bookable.
Instants are stored in UTC; recurring hours are interpreted in their IANA zone.
Nonexistent DST times are skipped; repeated times remain distinct instants.

Reservations run in one database transaction, serialize per teacher and student,
validate availability again, and reject overlap. Rescheduling must acquire the
new slot before releasing the old one, within that transaction. Cancellation
releases capacity. Teacher grids show the enrolled student's display name.

## Schema and rollout

The native calendar migration adds published teacher profiles and booking class
type, duration, provider and provisioning status. Private provider identifiers
remain on bookings, visible only to participants under existing RLS. Booking
writes go through authenticated database functions, not direct browser inserts.
Existing dated windows and bookings remain readable; no existing records are
deleted. Apply the migration before deploying the new UI.

Video provisioning is separate from the reservation transaction: provider outages
must not lose the reservation or report a fake meeting. Pending/unavailable
statuses are shown explicitly. Calendar invitations are not represented as
automatically accepted calendar entries. Students can download a native ICS file.

## Provider configuration

Native Zoom uses a server-to-server OAuth app and a host user ID. Native Google
Calendar/Meet uses a teacher-authorized refresh token and calendar ID. These
server-only credentials configure a single hosted tutor; a multi-teacher rollout
needs per-teacher OAuth connections before enabling automatic meetings for other
tutors. Set `CALENDAR_PROVIDER_TEACHER_ID` to bind credentials to the tutor.
Without credentials, booking works and accurately says the meeting is pending.

## Verification

Test two simultaneous students requesting the same interval (only one succeeds),
adjacent bookings, cancellation, failed and successful reschedule, both providers,
and New York DST on March 8 and November 1, 2026. Provider credential tests must
use a test host/calendar; do not create test invitations in a live teacher's account.

Run `pnpm test:calendar` on Node 22.15+ (or Node 23.5+). The suite exercises
JSON/HTML response handling, actual route handlers with isolated auth/database
fixtures, native Zoom/Google request construction with mocked HTTP responses,
timezone/slot/ICS logic, and the migration plus booking transactions in an
in-memory PostgreSQL instance. It never writes to hosted Supabase or sends real
meeting invitations. Provider credentials are still required for a live Zoom or
Google Meet end-to-end check; those are not claimed by the isolated tests.

If a newly created route returns an HTML 404 during development, restart `pnpm
run dev` so Next.js discovers it. The client now rejects non-JSON responses with
an actionable error instead of exposing a JSON parsing exception. A successful
reservation returns 201 even when video provisioning fails; the booking remains
confirmed and meeting status is reported separately.
