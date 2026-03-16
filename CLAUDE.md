# HealthEngine — CLAUDE.md

## What this is
A full-stack fitness tracker built with Next.js 15 (App Router), TypeScript, TailwindCSS, Prisma ORM, and iron-session. Users log workouts, calories, and weight. Auth is passwordless (email OTP).

## Stack
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS — black/white minimalist theme
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
