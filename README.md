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

- Teachers use FullCalendar's week, day, and month views. Drag a time range or use **Create class slot** to publish a class. Open future slots can be moved or resized; failed saves revert the change. Click a class to edit it, block/reopen it, or mark a confirmed class completed.
- Choose **Repeat every week as working hours** to save a rule in `teacher_availability`. Rules in the browser's timezone appear as background bands. Rules saved in another timezone are listed with their original timezone. Weekly hours do not create bookable sessions; publish individual slots in `class_sessions`.
- Students use a React DayPicker month calendar to choose a date, then select a published slot and confirm a booking through `class_bookings`. Booking and cancellation dialogs use React Aria for focus management and keyboard access.

All dated sessions are stored as UTC timestamps and displayed in the browser's local timezone. Existing Supabase RLS policies and booking uniqueness constraints remain responsible for authorization and concurrent booking conflicts. This UI change does not alter the remote database schema or policies.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
