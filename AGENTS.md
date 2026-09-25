# AGENTS.md

## Repository overview

Quanttoria is a small Next.js App Router site for personalized one-to-one maths coaching for US students. Keep the public marketing site and authenticated dashboard flows working together; avoid introducing a second routing, styling, or data-access pattern.

## Architecture and important directories

- `app/` — App Router routes and global styles.
  - `app/page.tsx` is the public landing page composition.
  - `app/login`, `app/signup`, and `app/forgot-password` contain auth entry pages.
  - `app/auth/callback/route.ts` handles the Supabase auth callback.
  - `app/dashboard`, `app/student/dashboard`, and `app/teacher/dashboard` contain dashboard routes.
  - `app/layout.tsx` defines metadata, Google fonts, analytics, and the root document.
  - `app/globals.css` contains Tailwind v4 imports, design tokens, base styles, and custom utilities.
- `components/` — Reusable page sections and interactive client components such as `SiteHeader`, `Hero`, `Contact`, `DemoDialog`, `AuthForm`, calendars, testimonials, and sign-out controls.
- `components/ui/` — shadcn/Base UI primitives. Prefer extending or composing these primitives instead of creating one-off controls.
- `lib/` — Shared helpers and service access.
  - `lib/site.ts` contains site copy/navigation constants.
  - `lib/utils.ts` contains shared class-name utilities.
  - `lib/auth.ts` contains profile lookup and role-based redirects.
  - `lib/supabase/` contains browser, server, and proxy Supabase clients.
- `public/` — Static brand assets and images. Reference assets with root-relative paths such as `/images/quanttoria-logo.png`.
- `middleware.ts` — Refreshes Supabase sessions for application routes through `lib/supabase/proxy.ts`.
- `next.config.mjs` — Next configuration; images are currently unoptimized and TypeScript build errors are currently ignored.

## Stack and versions

- Next.js `16.3.3`, App Router, React 19, and TypeScript 5.7.
- Tailwind CSS 4.3 with `@tailwindcss/postcss`, `tw-animate-css`, and shadcn `base-nova` configuration.
- Base UI React (`@base-ui/react`) and shadcn components; Lucide React for icons.
- Supabase JS 2.116 and `@supabase/ssr` 0.12 for authentication and server/browser clients.
- `@vercel/analytics` is rendered only in production.
- The repository currently contains both `package-lock.json` and `pnpm-lock.yaml`; use the package manager selected by the existing checkout/CI context and keep the corresponding lockfile consistent. Do not add dependencies casually.

## Coding and naming conventions

- Use strict TypeScript and the `@/*` path alias. Prefer named exports for components and helpers; route pages may use a default export as required by Next.js.
- Use PascalCase for React components, camelCase for functions/variables, and kebab-case for route directories and static filenames.
- Keep components focused and composable. Put reusable sections in `components/`, route-specific composition in `app/**/page.tsx`, and shared service logic in `lib/`.
- Use semantic HTML (`header`, `nav`, `main`, `section`, `footer`) and accessible labels, headings, button names, alt text, focus states, and `aria-*` attributes.
- Add `'use client'` only when a component needs browser state, event handlers, or client-only APIs. Keep pages and data access server-side by default.
- Preserve existing comments and generated Next.js instruction markers. Do not add debug logging unless needed for a specific investigation, and remove it before finishing.

## Pages and component patterns

- The landing page is a section assembly: `SiteHeader`, `Hero`, `WhyQuanttoria`, `Approach`, `MeetTutor`, `Testimonials`, `Contact`, `SiteFooter`, and `DemoDialog`. Preserve this order and anchor navigation unless the product request explicitly changes it.
- Use `next/link` for internal route navigation and normal anchors for same-page section links.
- Interactive components follow the current client-component pattern with local React state (`useState`) where appropriate. Mobile navigation is controlled by `SiteHeader`; dialogs/forms should retain accessible trigger and labeling behavior.
- Authenticated pages should use `requireRole()` from `lib/auth.ts` for server-side role checks rather than duplicating redirect logic.
- Use the existing `Button` primitive and its variants for actions. Use Lucide icons rather than hand-drawn SVGs or emoji.

## Styling and design system

- Tailwind utility classes are the primary styling mechanism. Global tokens and custom utilities live in `app/globals.css`; do not create a separate Tailwind config unless the project structure changes.
- The visual language is light-only, kid-friendly, and educational: warm off-white background, royal blue primary, sunny yellow accent, coral, mint, sky tint, and deep navy text.
- Typography is defined in `app/layout.tsx`: Baloo 2 (`font-display`) for headings/display copy and Nunito (`font-sans`) for body/UI text. Use the existing variables/utilities instead of importing additional fonts.
- Reuse semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.) and existing radius/shadow patterns. Avoid arbitrary colors that bypass the palette.
- Keep layouts responsive mobile-first. Prefer flexbox for one-dimensional layouts and grid for genuinely two-dimensional layouts; use the existing max-width and spacing rhythm.
- Preserve the graph-paper utility and branded imagery where they support the landing-page design. Do not replace real assets with placeholders.

## Data fetching, state, and APIs

- There is no general API client or state-management library in the current project. Use React local state for UI-only state and server components for route data.
- Supabase is the source of truth for auth and profile data. Use `createClient()` from `lib/supabase/server.ts` in server code and the browser client helper in client code; do not instantiate Supabase clients ad hoc.
- Always scope profile/data queries to the authenticated user or authorized role. Use `.maybeSingle()` and explicit select lists where that matches existing patterns.
- For new server endpoints, use App Router route handlers under `app/**/route.ts`, validate inputs, return appropriate status codes, and never expose service-role credentials to the browser.
- Do not introduce localStorage as a substitute for persistence. If persistent product data is needed, extend the existing Supabase-backed approach and document/schema the change before coding.

## Authentication, security, and environment variables

- Authentication uses native Supabase Auth with SSR cookies. Session refresh is handled by `middleware.ts` and `lib/supabase/proxy.ts`; do not bypass it with client-only auth checks.
- Use `supabase.auth.getUser()` for trusted server-side identity checks. Do not trust a client-provided user ID or role.
- Public browser configuration uses `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key fallback. Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only and never prefix them with `NEXT_PUBLIC_`.
- Read environment variables through `process.env`; never commit secrets, `.env` files, tokens, or credentials. Preserve the existing redirect/callback environment configuration, including `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`.
- Validate and sanitize user input, especially contact/auth form data. Keep redirects limited to known internal paths to avoid open redirects.

## Testing and validation

The package currently defines only `dev`, `build`, and `start` scripts; there is no configured test runner or lint script. For changes:

1. Run the narrowest relevant manual check in the browser using the dev server (`npm run dev` or the repository-selected package-manager equivalent).
2. Exercise affected navigation, forms, auth redirects, responsive states, and dashboard role guards as applicable.
3. Run `npm run build` (or the equivalent package-manager command) for route/config/dependency changes. Note that `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`, so a successful build is not a substitute for type review.
4. Inspect browser console and server output for runtime errors; do not leave temporary diagnostics in the code.

## Build and deployment

- Use `next dev` for local development and `next build && next start` for a production-style check.
- Deploy through the connected Vercel project. The repository README states that merges to `main` automatically deploy; do not add custom deployment logic.
- Keep `next.config.mjs`, lockfiles, Supabase middleware, and environment-variable names compatible with Vercel. When adding a dependency, install it first and commit the matching manifest/lockfile changes.

## Safe change rules

- Inspect the relevant route, component, helper, and consumer before editing. Make the smallest change that satisfies the request and preserve unrelated behavior.
- Do not modify application code when the task is documentation-only. For normal feature work, avoid broad rewrites of the landing-page section composition or auth/session plumbing.
- Preserve existing public routes, anchor IDs, metadata, responsive behavior, and Supabase callback/session handling unless explicitly asked to change them.
- Prefer existing components, tokens, assets, and helpers over parallel implementations. Remove unused imports only after removing their usage.
- After changes, review the diff, run the relevant validation, and report any checks blocked by missing configuration rather than masking the problem.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<automated_v0_instructions_reminder>

- Reuse gathered context; stop searching once the change and validation path are clear. Follow up on specific correctness questions as needed
- Run independent lookups in parallel and dependent lookups sequentially
- Issue every independent Edit/Write call in one response instead of one file per response.

</automated_v0_instructions_reminder>

<!-- End of repository-specific agent guidance -->

## Common commands

```bash
npm run dev
npm run build
npm run start
```

Use the package manager and lockfile selected by the repository's CI/deployment context when it differs from npm.

## Change checklist

- Inspect the affected route/component and its callers before editing.
- Reuse existing Supabase clients, UI primitives, tokens, and assets.
- Preserve authentication/session behavior and public routes.
- Validate the changed flow in the browser and run a production build when relevant.
- Review the diff and keep changes focused.
```
