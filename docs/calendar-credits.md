# Calendar durations and credits

Custom durations are 15–180 minutes in 15-minute increments. Both regular and
trial classes cost 1 credit per hour, prorated (45 minutes = 0.75 credit).

Apply `20261001123257_calendar_duration_credits.sql` after the native-calendar
migration. Balances are stored as integer minutes in `student_calendar_credits`
to avoid rounding. Missing wallets have zero credits; no balance is inferred
from historical bookings or payment records. Existing bookings are preserved,
not retroactively charged, and cannot create a refund for credits never deducted.

Booking debits, refunds for future cancellations, and duration changes during
rescheduling are atomic with the reservation transaction. The same student lock
serializes wallet changes across teachers. A failed booking/reschedule changes
neither the balance nor the original booking. Repeated cancellations never refund
twice. Clients can read only their own balance (admins can inspect balances) and
cannot grant themselves credits. A trusted administrator must fund wallets using
the Supabase SQL editor/server-side billing workflow; no payment or credit-grant
UI is introduced by this change.

Join requires a confirmed, not-ended booking and a real HTTPS meeting URL. A
pending legacy status alone does not invalidate an existing URL. Without a URL,
the card explains that the teacher must supply/configure the meeting link. No
placeholder meetings or URLs are generated, and admin-preview bookings still
skip real video provisioning.
