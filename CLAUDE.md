# HealthEngine — CLAUDE.md

## What this is
A full-stack fitness tracker built with Next.js 15 (App Router), TypeScript, TailwindCSS, Prisma ORM, and iron-session. Users log workouts, calories, and weight. Auth is passwordless (email OTP).

## Stack
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS — black/white/purple theme with dark mode (`darkMode: 'class'`)
- **Database**: SQLite in dev (`prisma/dev.db`), swap to PostgreSQL for production
- **ORM**: Prisma
- **Sessions**: iron-session (encrypted cookie, 1-week expiry)
- **Email**: Mocked (console.log in dev) — stubbed for AWS SES in prod

## Commands
```bash
npm run dev          # start dev server at localhost:3000
npm run build        # production build
npm run db:migrate   # apply Prisma migrations (creates dev.db on first run)
npm run db:seed      # seed test data (test@example.com)
npm run db:studio    # open Prisma Studio (visual DB browser)
npm run db:generate  # regenerate Prisma client after schema changes
npm run format       # Prettier
npm run lint         # ESLint
```

## Folder structure
```
src/
  middleware.ts              # Route guard — runs on Edge, checks iron-session cookie
  app/
    page.tsx                 # Root: redirects to /dashboard or /login
    layout.tsx               # Root HTML shell
    globals.css              # Tailwind base + scrollbar
    (auth)/login/page.tsx    # 2-step OTP login (client component)
    (dashboard)/
      layout.tsx             # Wraps all dashboard pages with TopNav
      dashboard/page.tsx     # Server component — stats summary
      workouts/page.tsx      # Client component — log + list workouts
      calories/page.tsx      # Client component — log + list calories + daily totals
      weight/page.tsx        # Client component — log + list weight + trend
    api/
      auth/send-code/        # POST — generate OTP, store in DB, mock-email it
      auth/verify-code/      # POST — validate OTP, create session cookie
      auth/logout/           # POST — destroy session
      workouts/              # GET + POST
      workouts/[id]/         # DELETE
      calories/              # GET + POST
      calories/[id]/         # DELETE
      weight/                # GET + POST
      weight/[id]/           # DELETE
  components/
    nav/TopNav.tsx           # Client — nav links + sign out button
    ui/Card.tsx              # Simple bordered card
    ui/Button.tsx            # primary / secondary / danger variants
    ui/StatCard.tsx          # Big number stat display
    forms/WorkoutForm.tsx    # Controlled form → POST /api/workouts
    forms/CalorieForm.tsx    # Controlled form → POST /api/calories
    forms/WeightForm.tsx     # Controlled form → POST /api/weight
    lists/WorkoutList.tsx    # Renders entries + DELETE button
    lists/CalorieList.tsx
    lists/WeightList.tsx
  lib/
    prisma.ts                # Singleton PrismaClient (safe for hot reload in dev)
    session.ts               # SessionData type, sessionOptions, getSession() helper
    email.ts                 # sendVerificationEmail() — mock or AWS SES
  types/index.ts             # Shared TS interfaces (WorkoutEntry, CalorieEntry, WeightEntry)
prisma/
  schema.prisma              # DB models: User, VerificationCode, WorkoutEntry, CalorieEntry, WeightEntry
  seed.ts                    # Test data seeder
```

## Auth flow
1. `/login` → user enters email → `POST /api/auth/send-code`
   - Deletes any existing code for that email
   - Generates a random 6-digit code, stores it in `VerificationCode` table with 10-min expiry
   - Calls `sendVerificationEmail()` — in dev this logs the code to the terminal
2. User enters the code → `POST /api/auth/verify-code`
   - Finds code in DB, checks it hasn't expired
   - Deletes the code (one-time use)
   - Upserts the `User` row (creates on first login)
   - Writes an encrypted `iron-session` cookie
3. Subsequent requests → middleware reads the cookie, redirects unauthenticated users to `/login`
4. `POST /api/auth/logout` → destroys the session cookie

## Session architecture
- `src/lib/session.ts` exports `sessionOptions` (plain object, Edge-safe) and `getSession()` (uses `next/headers`, Node.js only — call from API routes and Server Components)
- `src/middleware.ts` uses `getIronSession(request.cookies, sessionOptions)` directly — no `next/headers`, works in Edge runtime
- All API routes call `getSession()` and check `session.isLoggedIn` before touching the DB

## Database models
| Model | Key fields |
|---|---|
| User | id, email, createdAt |
| VerificationCode | email, code, expiresAt |
| WorkoutEntry | userId, workoutType, duration (min), notes? |
| CalorieEntry | userId, calories, protein?, carbs?, fat? |
| WeightEntry | userId, weight (kg), bodyFat? |

## Color system
- **Purple accent**: `violet-600` (light mode), `violet-400` (dark mode) — used for active nav, primary buttons, stat values, brand "Engine" text, link hovers
- **Backgrounds**: `white` / `zinc-50` (light), `zinc-950` (dark page), `zinc-900` (dark cards)
- **Borders**: `zinc-200` (light), `zinc-800` (dark)
- **Text muted**: `zinc-500` (light), `zinc-400` (dark)
- **Dark mode**: toggled via `class` strategy. Inline script in `layout.tsx` reads `localStorage.theme` before first paint to prevent flash. Toggle button in `TopNav`.
- **Input fields**: use the `.form-input` CSS utility class (defined in `globals.css`) — gives zinc borders, dark bg, violet focus ring
- **Stat cards**: violet gradient bar at top (`h-0.5`), violet value text
- **Primary button**: `bg-violet-600 hover:bg-violet-700` (light) / `bg-violet-500 hover:bg-violet-400` (dark)

## Component rules
- **Mobile-first always**: Every component must work on both desktop and mobile. Use Tailwind responsive prefixes (`sm:`, `md:`) mobile-first — default styles target small screens, larger breakpoints override upward.
- **No fixed-width grids on mobile**: Multi-column grids must stack on mobile. Use `grid-cols-1 sm:grid-cols-N`, never `grid-cols-N` alone for forms or content layouts.
- **Responsive text**: Large display text must scale down. Use `text-2xl sm:text-3xl` patterns — never `text-3xl` or above without a smaller mobile base.
- **Responsive padding**: Cards and containers use `p-4 sm:p-6`, not fixed `p-6` or `p-8` alone.
- **Navigation**: The TopNav hides links on mobile and shows a hamburger menu. Do not add inline nav items that would overflow on small screens.
- **Touch targets**: Interactive elements (buttons, links) must be at least 44px tall on mobile. Use `py-2` or `py-3` on touch controls.
- **`max-w-*` containers**: Never use `max-w-xs` alone as a width constraint on content — wrap with `sm:max-w-xs` so it goes full-width on mobile.
- **Dark mode on all new components**: Every new component must include `dark:` variants. Never use `border-black`, `text-black`, `bg-white`, or `text-gray-*` without a `dark:` counterpart.

## Switching to PostgreSQL (production)
1. Change `prisma/schema.prisma` datasource provider to `"postgresql"`
2. Set `DATABASE_URL="postgresql://..."` in env
3. Run `npm run db:migrate`

## Enabling AWS SES (real email)
In `src/lib/email.ts`, uncomment the SES block and set:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SES_FROM_EMAIL=noreply@yourdomain.com
```
Then: `npm install @aws-sdk/client-ses`

## Environment variables
| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | yes | SQLite file path or Postgres connection string |
| SESSION_SECRET | yes | Min 32 chars, used to encrypt session cookies |
| NEXT_PUBLIC_APP_URL | no | Used for absolute URLs |
| AWS_REGION | prod only | For SES |
| AWS_ACCESS_KEY_ID | prod only | For SES |
| AWS_SECRET_ACCESS_KEY | prod only | For SES |
| SES_FROM_EMAIL | prod only | From address for emails |
