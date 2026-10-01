# quanttoria-8e

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_PGchoUJGM2KbOMpBmPj3q2pkxGNJ)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Dashboard calendars

Both dashboards use the existing Supabase clients and tables. Set the Supabase variables from `.env.example` in `.env.local`; no Google Calendar account or calendar URL is required.

- Teachers use FullCalendar's week/day/month views, with student names on booked classes. Publish dated windows or recurring weekly working hours. Both are bookable; open windows can be moved/resized, with database conflict checks.
- Students use a native Cal.com-style teacher/date/time booking page with trial/regular classes, 30/60-minute durations, Zoom/Google Meet preference, timezone selection, confirmation cards, cancellation and rescheduling.
- Calendar data access, slot generation and provider adapters are isolated in `lib/calendar`, consumed by the dashboards and `/api/calendar` routes. No Cal.com/cal.diy service is required.

Apply `supabase/migrations/20261001110024_native_calendar_booking.sql` before deploying this feature. The migration preserves existing records, adds published teacher profiles and booking metadata, and routes booking writes through authorized, conflict-checked transactions. See [native calendar design and setup](docs/native-calendar.md).

Sessions are stored as UTC instants. Weekly hours use IANA timezones, including DST. Optional server-only provider credentials are documented in `.env.example`; missing credentials never produce fake meeting or calendar confirmations. ICS downloads work without provider credentials.

Run all isolated calendar checks with `pnpm test:calendar` (Node 22.15+), type-check with `pnpm exec tsc --noEmit`, and build with `pnpm run build`. If the local environment blocks Turbopack workers, use `pnpm exec next build --webpack` for the production check.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
