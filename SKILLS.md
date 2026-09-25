# Quanttoria AI Coding Agent Skills

This file describes the repository-specific practices for Quanttoria (`quanttoria.com`). Apply these instructions before changing application code.

## 1. Repository architecture

- `app/` is the Next.js App Router surface.
  - `app/page.tsx` composes the public landing page.
  - `app/login`, `app/signup`, and `app/forgot-password` contain auth screens.
  - `app/auth/callback/route.ts` handles the Supabase auth callback.
  - `app/dashboard`, `app/student/dashboard`, and `app/teacher/dashboard` are authenticated dashboard routes.
  - `app/layout.tsx` owns document metadata, Google fonts, the root layout, and production analytics.
  - `app/globals.css` owns Tailwind imports, design tokens, base rules, and custom utilities.
- `components/` contains reusable landing-page sections and client interactions: `SiteHeader`, `Hero`, `DemoDialog`, `AuthForm`, `ClassCalendar`, `Testimonials`, `Contact`, and related sections.
- `components/ui/` contains shadcn/Base UI primitives. Compose these before creating new controls.
- `lib/` contains shared helpers and service access. `lib/site.ts` holds site constants, `lib/utils.ts` holds class merging, `lib/auth.ts` holds role/profile redirect logic, and `lib/supabase/` contains browser, server, and proxy clients.
- `middleware.ts` refreshes Supabase sessions through `lib/supabase/proxy.ts`.
- `public/` contains the Quanttoria logo, illustrations, tutor/avatar assets, and icons. Use real existing assets rather than placeholders.

## 2. Stack and Next.js/React patterns

- Runtime stack: Next.js `16.3.3`, App Router, React 19, TypeScript `5.7.3`.
- Styling stack: Tailwind CSS `4.3.3`, `@tailwindcss/postcss`, `tw-animate-css`, shadcn `base-nova`, `@base-ui/react`, `class-variance-authority`, `tailwind-merge`, and `clsx`.
- Icons: `lucide-react`. Do not add hand-drawn SVG icons or emoji UI icons.
- Keep routes and data access server-side by default. Add `'use client'` only for event handlers, browser APIs, or local interactive state.
- Route pages use the required default export; reusable components and helpers should generally use named exports.
- In Next.js 16, await asynchronous route props such as `params`, `searchParams`, `headers()`, and `cookies()` when they are used.
- Use `next/link` for internal navigation and normal anchors for same-page section links.
- Use the `@/*` TypeScript path alias for project imports.
- Naming: PascalCase for React components, camelCase for functions/variables, kebab-case for route directories and static filenames.

## 3. UI and design-system implementation

- The public page is intentionally composed in this order: `SiteHeader`, `Hero`, `WhyQuanttoria`, `Approach`, `MeetTutor`, `Testimonials`, `Contact`, `SiteFooter`, and `DemoDialog`. Preserve this structure and anchor IDs unless the request explicitly changes the information architecture.
- Tailwind utilities are the primary styling mechanism. Put shared visual tokens/utilities in `app/globals.css`; do not introduce a parallel Tailwind configuration casually.
- Use semantic tokens such as `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, and existing button variants instead of arbitrary colors.
- Quanttoria is light-only, kid-friendly, and educational: warm off-white background, royal blue primary, sunny yellow accent, coral, mint, sky tint, and deep navy text. Avoid dark-mode-only or unrelated visual systems.
- Typography is already defined in `app/layout.tsx`: Baloo 2 (`font-display`) for headings and Nunito (`font-sans`) for body/UI text. Reuse these variables and do not import another font without a clear product reason.
- Reuse `components/ui/button.tsx` and other primitives. Prefer composition and variants over one-off duplicated markup.
- Use flexbox for most one-dimensional layouts and grid only for genuinely two-dimensional arrangements. Preserve the established spacing, rounded corners, shadows, and graph-paper utility.
- Keep components focused; move repeated sections or behavior into `components/` rather than expanding a large `page.tsx`.

## 4. Responsive and accessibility requirements

- Build mobile-first and verify desktop and narrow layouts for every visible change. Do not rely on fixed widths that force horizontal scrolling.
- Use semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and a logical heading hierarchy.
- Every meaningful image needs descriptive `alt` text; decorative images should use empty alt text. Reference public files with root-relative paths such as `/images/quanttoria-logo.png`.
- Buttons and links need clear accessible names, visible focus styles, and sufficient contrast. Forms need associated labels, useful autocomplete attributes, and inline error text that is understandable without color alone.
- Preserve keyboard access and accessible labeling/trigger behavior for dialogs, mobile navigation, calendars, and auth forms. Test the open/close and error states, not only the default state.

## 5. Data, Supabase, auth, and state

- Supabase is the source of truth for authentication and profile/role data. Use `createClient()` from `lib/supabase/server.ts` in server code and the existing browser helper in client code. Never instantiate ad hoc clients.
- Use `supabase.auth.getUser()` for trusted server identity checks. Do not trust a client-supplied user ID, role, or redirect target.
- Authenticated pages should use `requireRole()` from `lib/auth.ts` for role checks and redirects rather than duplicating authorization logic.
- Session refresh is centralized in `middleware.ts` and `lib/supabase/proxy.ts`; preserve this flow when adding routes.
- There is no global state library or general API client. Use server components for route data and local React state for UI-only state. Do not introduce `localStorage` as persistence.
- If persistent product data is required, extend the Supabase-backed approach with appropriate schema/RLS work and user/role scoping. Use explicit select lists and `.maybeSingle()` where the existing pattern calls for it.
- New server endpoints belong in `app/**/route.ts`. Validate inputs, return meaningful HTTP status codes, and keep privileged operations server-only.

## 6. Forms, validation, and errors

- Reuse the patterns in `components/auth-form.tsx` and existing contact/demo flows before adding a new form abstraction.
- Validate and normalize user input at the boundary, especially email, password, contact, and scheduling fields. Never rely on client validation alone for security-sensitive operations.
- Keep loading, success, and failure states explicit. Disable or guard submit actions while requests are pending and avoid duplicate submissions.
- Show actionable inline errors while preserving entered values when safe. Do not expose Supabase internals, secrets, stack traces, or sensitive account details to users.
- Handle auth callback failures and invalid redirects safely; allow redirects only to known internal paths.

## 7. Testing, debugging, and validation

The manifest currently defines only these scripts:

```bash
npm run dev
npm run build
npm run start
```

- There is no configured test runner or lint script. For UI changes, run the dev server and verify the affected route in a real browser, including responsive and interactive states.
- Check browser console and server output for runtime errors. When debugging preview issues, inspect `user_read_only_context/v0_debug_logs.log` if available and remove temporary `[v0]` diagnostics before finishing.
- Run `npm run build` for route, dependency, configuration, or deployment-affecting changes. `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`, so a green build does not replace careful TypeScript review.
- Use the package manager selected by the checkout/CI context. The repository contains both `package-lock.json` and `pnpm-lock.yaml`; do not update both casually or install dependencies without keeping the chosen manifest/lockfile consistent.
- Review `git diff` and verify that only intended files changed.

## 8. Performance and SEO

- Keep public pages server-rendered where possible and avoid unnecessary client boundaries or browser-only dependencies.
- Avoid fetching in `useEffect`; pass server-fetched data down or use an established data-fetching abstraction if one is deliberately introduced.
- Preserve `app/layout.tsx` metadata, viewport, font loading, favicon configuration, and production-only `@vercel/analytics` behavior. Update metadata when adding a route or materially changing public content.
- Prefer optimized, appropriately sized existing assets and avoid adding large duplicate images. `next.config.mjs` currently has image optimization disabled, so be especially careful with asset dimensions and formats.
- Preserve semantic headings, descriptive metadata, accessible links, and Open Graph values for SEO.

## 9. Security and environment variables

- Native Supabase Auth uses SSR cookies. Keep `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key available to browser code only as intended.
- Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose them through `NEXT_PUBLIC_*`, client components, logs, URLs, or committed files.
- Read configuration through `process.env`; never commit `.env` files, tokens, credentials, or generated secrets. Existing project variables include Supabase URLs/keys and `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`; preserve their names and callback behavior.
- Scope every user-data query by the authenticated user or authorized role, and preserve Supabase RLS expectations for new tables/policies.
- Validate all external input and use parameterized Supabase queries. Do not create open redirects, unsafe HTML injection, or privileged browser actions.

## 10. Deployment and safe change workflow

- The app deploys through the connected Vercel project. The repository workflow expects merges to `main` to deploy; do not add custom deployment logic or bypass the existing project configuration.
- Keep `next.config.mjs`, middleware, environment-variable names, and the selected lockfile compatible with Vercel.
- Before editing, inspect the affected route/component, its imports, and its consumers. Reuse existing helpers, primitives, tokens, assets, and auth plumbing.
- Make the smallest complete change. Avoid broad rewrites of landing-page composition, session refresh, or role redirects for unrelated features.
- Preserve public routes, anchor IDs, metadata, mobile navigation behavior, Supabase callbacks, and dashboard guards unless explicitly asked to change them.
- For refactors, move behavior incrementally, keep the old contract until callers are migrated, and remove dead code only after confirming there are no remaining imports/usages.
- Never modify application code for a documentation-only task. For normal changes, validate the affected flow, run the relevant build check, inspect the diff, and report any missing configuration rather than masking it.

## Common paths

- Public page: `app/page.tsx`
- Root metadata/fonts: `app/layout.tsx`
- Tokens/base styles: `app/globals.css`
- Auth entry: `app/login/page.tsx`, `app/signup/page.tsx`, `components/auth-form.tsx`
- Auth callback: `app/auth/callback/route.ts`
- Role protection: `lib/auth.ts`, `app/dashboard/page.tsx`, `app/student/dashboard/page.tsx`, `app/teacher/dashboard/page.tsx`
- Supabase clients/session refresh: `lib/supabase/`, `middleware.ts`
- Shared UI: `components/`, `components/ui/`
- Build configuration: `next.config.mjs`, `package.json`, `tsconfig.json`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quick checklist

- Inspect the route/component and consumers first.
- Reuse existing tokens, primitives, assets, Supabase clients, and auth helpers.
- Keep server/client boundaries intentional and preserve SSR session handling.
- Verify accessibility, responsive behavior, runtime console output, and build status.
- Review the diff and keep unrelated application behavior unchanged.

ே
