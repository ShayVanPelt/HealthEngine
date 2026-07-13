# HealthEngine — AGENTS.md

> **RULE: Update this file whenever you add, change, or remove any component, API route, DB model, hook, or architectural pattern. This is a living document — keep it current.**

## What this is
A full-stack fitness tracker built with Next.js 15 (App Router), TypeScript, TailwindCSS, Prisma ORM, and iron-session. Users log workouts, calories, and weight. Auth is passwordless (email OTP).

## Stack
- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS + shadcn/ui (v4) — black/white/purple theme with dark mode (`darkMode: 'class'`)
- **UI components**: shadcn/ui — all primitive UI is from shadcn, never hand-rolled
- **Database**: PostgreSQL via Prisma (Docker locally via `docker-compose.yml`; Neon or any Postgres in production)
- **ORM**: Prisma
- **Sessions**: iron-session (encrypted cookie, 1-week expiry)
- **Email**: Resend (prod) — console mock in dev

## Local development setup
1. Start Docker Desktop, then run `docker compose up -d` — starts Postgres 16 as `healthengine-pg` on port `5432` (`postgres` / `password` / db `healthengine`)
2. Copy `.env.example` → `.env` (default `DATABASE_URL` points at local Docker Postgres)
3. Leave Resend vars commented out in `.env` so OTP codes log to the terminal
4. `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`
5. Do **not** point local `.env` at the production Neon database

```bash
docker compose up -d      # start local Postgres
docker compose down       # stop (keeps volume/data)
docker compose down -v    # stop and wipe DB volume
```

## Commands
```bash
npm run dev          # start dev server at localhost:3000
npm run build        # production build
npm run db:migrate   # apply Prisma migrations to DATABASE_URL
npm run db:seed      # seed test data (test@example.com)
npm run db:studio    # open Prisma Studio (visual DB browser)
npm run db:generate  # regenerate Prisma client after schema changes
npm run format       # Prettier
npm run lint         # ESLint
```

> **After any `prisma migrate dev`, always stop the dev server and run `npm run db:generate` before restarting.** The Next.js process holds the Prisma query engine binary, which prevents the client from being regenerated while it's running.

## Folder structure
```
src/
  middleware.ts              # Route guard — runs on Edge, checks iron-session cookie
  app/
    page.tsx                 # Root: redirects to /dashboard or /login
    layout.tsx               # Root HTML shell
    globals.css              # Tailwind base + scrollbar + animation keyframes/utilities
    (auth)/login/page.tsx    # 2-step OTP login (client component)
    (dashboard)/
      layout.tsx             # Wraps all dashboard pages with PreferencesProvider + ToastProvider + TopNav
      dashboard/page.tsx     # Server component — fetches raw data, renders DashboardStats + quick actions + GoalSetupCard
      workouts/page.tsx      # Client component — workout calendar + exercise history + Start Workout CTA + resume banner
      workouts/live/page.tsx # Client component — live Workout Mode: pick exercises, log sets one by one, rest timer, finish/discard
      calories/page.tsx      # Client component — log + list calories + CalendarView date selector + per-day totals
      weight/page.tsx        # Client component — log + list weight + trend
      settings/page.tsx      # Client — theme + units; mobile-only Account card with Sign out (desktop sign out remains in TopNav)
    api/
      auth/send-code/        # POST — generate OTP, store in DB, mock-email it (rate-limited; returns devMode flag)
      auth/verify-code/      # POST — validate OTP, create session cookie (rate-limited)
      auth/logout/           # POST — destroy session
      goals/                 # GET + PATCH — fetch/upsert per-user goals (UserGoal model, validated)
      workouts-v2/           # GET (?date=YYYY-MM-DD | ?month=YYYY-MM, COMPLETED only) + POST (merges into same-day workout)
      workouts-v2/[id]/      # DELETE + PATCH (replace sets on a WorkoutExercise, validated)
      workouts-v2/live/      # GET (current IN_PROGRESS workout) + POST (start live session)
      workouts-v2/[id]/sets/     # PATCH — sync one exercise's sets during a live session
      workouts-v2/[id]/complete/ # PATCH — finish live session (deletes it if empty)
      exercises/             # GET (list user's exercises) + POST (create exercise with type)
      exercises/[id]/        # PATCH — rename/change type; DELETE — remove exercise and its history
      exercise-history/      # GET (?exerciseId=) — per-exercise set history
      calories/              # GET (?date=YYYY-MM-DD | ?month=YYYY-MM | all) + POST (mealName required; optional date+tz for backdating)
      calories/[id]/         # DELETE
      calories/summary/      # GET (?days=N, default 30, max 90) — per-day aggregated totals for CalorieBarChart
      weight/                # GET + POST
      weight/[id]/           # DELETE
  components/
    nav/TopNav.tsx           # Client — desktop: nav links + sign out; mobile: logo only (sign out is on Settings); primary nav is MobileFloatingNav
    nav/MobileFloatingNav.tsx # Client — sm:hidden; floating bottom tab bar (icons + labels) + safe-area padding
    nav/dashboard-routes.ts  # Shared hrefs/labels for TopNav + mobile tabs
    ui/StatCard.tsx          # Big number stat display — supports trend chip + progress bar
    ui/ToastProvider.tsx     # Context-based toast system (success/error/info) — wraps dashboard layout
    ui/LoadingDots.tsx       # Shared three-dot loading indicator (accessible role="status")
    dashboard/
      GoalSetupCard.tsx      # Full-width goals display + inline edit form (client) — unit-aware
      DashboardStats.tsx     # Client component — renders stat cards + suggestions with unit-aware display; receives raw numbers from Server Component dashboard/page.tsx
    charts/
      WeightChart.tsx        # Client — recharts AreaChart; weight trend over last 30 entries; unit-aware
      CalorieBarChart.tsx    # Client — recharts BarChart; 30-day daily calorie history; fetches /api/calories/summary
    forms/CalorieForm.tsx    # Controlled form → POST /api/calories
    forms/WeightForm.tsx     # Controlled form → POST /api/weight
    lists/CalorieList.tsx    # Calorie entry list with ghost delete button + empty state
    lists/WeightList.tsx
    workouts/
      CalendarView.tsx           # Month calendar — highlights workout dates, handles day selection
      WorkoutDayView.tsx         # Shows exercises + sets + volume for a selected date (BW-aware display)
      AddWorkoutModal.tsx        # Dialog — log a past workout; validates weight/reps/RPE ranges; bodyweight-aware
      AddExerciseModal.tsx       # Dialog — create a new exercise with a Weighted/Bodyweight type selector
      EditExerciseModal.tsx      # Dialog — rename or permanently delete a library exercise and its workout history
      EditWorkoutExerciseModal.tsx # Dialog — edit sets; validates ranges; toast on save/delete; bodyweight-aware
      ExerciseHistoryView.tsx    # Historical sets for an exercise — all-time PR + per-session deltas (reps for BW, weight otherwise)
  hooks/
    useToast.ts              # Hook — returns { toast(message, variant) } from ToastContext
    useChartColors.ts        # Hook — reads CSS variables at runtime; re-reads on dark/light class toggle; used by all chart components
  contexts/
    PreferencesContext.tsx   # React context — theme + unit preferences; persisted to localStorage; exposes usePreferences()
  lib/
    prisma.ts                # Singleton PrismaClient (safe for hot reload in dev)
    session.ts               # SessionData type, sessionOptions, getSession() helper
    api-utils.ts             # requireAuth() helper for API routes
    email.ts                 # sendVerificationEmail() — Resend in prod, console mock in dev
    units.ts                 # Pure unit conversion + formatting utilities (kg↔lbs, g↔oz, kcal/Cal)
    rate-limit.ts            # In-memory fixed-window rate limiter (auth endpoints)
    workout-validation.ts    # validateSets() — shared server-side set validation (weight 0–500 kg, reps 1–50, RPE 1–10, no all-null sets)
  types/index.ts             # Shared TS interfaces (CalorieEntry, Workout, UserGoal, StatTrend…)
prisma/
  schema.prisma              # DB models (see below)
  seed.ts                    # Test data seeder
```

## Auth flow
1. `/login` → user enters email → `POST /api/auth/send-code`
   - Rate-limited: 5 codes per email per 10 minutes (`src/lib/rate-limit.ts`)
   - Deletes any existing code for that email
   - Generates a random 6-digit code, stores it in `VerificationCode` table with 10-min expiry
   - Calls `sendVerificationEmail()` — in dev this logs the code to the terminal
   - Response includes `devMode: true` when no `RESEND_API_KEY` is set; the login UI only shows the "code is logged to the console" hint in that case
2. User enters the code → `POST /api/auth/verify-code`
   - Rate-limited: 10 attempts per email per 10 minutes
   - Finds code in DB, checks it hasn't expired
   - Deletes the code (one-time use)
   - Upserts the `User` row (creates on first login)
   - Writes an encrypted `iron-session` cookie
3. Subsequent requests → middleware reads the cookie, redirects unauthenticated users to `/login` (protected: /dashboard, /workouts, /calories, /weight, /settings)
4. `POST /api/auth/logout` → destroys the session cookie

The login page sanitizes the `?redirect=` param — only relative paths matching `^/[a-zA-Z0-9/_-]*$` are honored (open-redirect protection).

## Session architecture
- `src/lib/session.ts` exports `sessionOptions` (plain object, Edge-safe) and `getSession()` (uses `next/headers`, Node.js only — call from API routes and Server Components)
- `src/middleware.ts` uses `getIronSession(request.cookies, sessionOptions)` directly — no `next/headers`, works in Edge runtime
- All API routes call `getSession()` and check `session.isLoggedIn` before touching the DB

## Database models
| Model | Key fields |
|---|---|
| User | id, email, createdAt |
| VerificationCode | email, code, expiresAt |
| CalorieEntry | userId, mealName?, calories, protein?, carbs?, fat? |
| WeightEntry | userId, weight (kg), bodyFat? |
| Exercise | userId, name, type (`ExerciseType`: WEIGHTED default / BODYWEIGHT / TIMED reserved) |
| Workout | userId, date, status (`WorkoutStatus`: COMPLETED default / IN_PROGRESS), startedAt?, completedAt? |
| WorkoutExercise | workoutId, exerciseId — junction: one exercise within a workout |
| WorkoutSet | workoutExerciseId, weight?, reps?, effort? (RPE 1–10), completedAt? (set in live mode) |
| UserGoal | userId (unique), dailyCalories?, weeklyWorkouts?, targetWeight? |

**Workout hierarchy**: `Workout` → `WorkoutExercise[]` → `WorkoutSet[]`

One `Workout` per date — POST merges new exercises into an existing completed workout on the same date instead of creating a duplicate session. A workout contains multiple `WorkoutExercise` entries (one per movement), each with one or more `WorkoutSet` rows tracking weight, reps, and RPE.

**Bodyweight exercises** (`Exercise.type === 'BODYWEIGHT'`): reps are the primary metric and are required per set; `weight` stores optional *added* load (vest/belt) and displays as `BW` / `BW+Xkg`. Volume chips show total reps instead of tonnage, and history PRs compare max reps instead of max weight.

**UserGoal**: one row per user (upserted via PATCH `/api/goals`). All fields are optional — only set fields are used for progress bars and suggestions on the dashboard.

## Goals API (`/api/goals`)
- `GET` — returns the current user's `UserGoal` row (or `null`)
- `PATCH` — body: `{ dailyCalories?, weeklyWorkouts?, targetWeight? }` — upserts the row; pass `null` to clear a field
- Server-side validation: dailyCalories 0–50,000 (integer), weeklyWorkouts 0–14 (integer), targetWeight 0–500 kg

## Workout API (`/api/workouts-v2`)
- `GET ?month=YYYY-MM` — returns array of ISO date strings that have **completed** workouts (calendar highlighting)
- `GET ?date=YYYY-MM-DD` — returns completed `Workout[]` with nested `workoutExercises → exercise + sets`
- `POST` — body: `{ date: string, exercises: [{ exerciseId, sets: [{ weight?, reps?, effort? }] }] }` — if a completed workout already exists on that date, the exercises are appended to it; otherwise a new Workout is created
- `DELETE /api/workouts-v2/[id]` — deletes a Workout (or one exercise via `?exerciseId=`; cascades to sets)
- `PATCH /api/workouts-v2/[id]` — replaces sets on a WorkoutExercise; rejects empty `sets[]`
- All set writes go through `validateSets()` in `src/lib/workout-validation.ts` (weight 0–500 kg, reps 1–50, RPE 1–10, at least one field per set)

## Live Workout API (Workout Mode)
- `GET /api/workouts-v2/live` — returns the user's current `IN_PROGRESS` workout (or `null`) — used for the resume flow
- `POST /api/workouts-v2/live` — body: `{ date: 'YYYY-MM-DD' }` — creates an `IN_PROGRESS` workout shell with `startedAt`; if one already exists it is returned instead
- `PATCH /api/workouts-v2/[id]/sets` — body: `{ exerciseId, sets: [{ weight?, reps?, effort?, completed? }] }` — creates the WorkoutExercise on first sync, then replaces its sets; `completed: true` stamps `WorkoutSet.completedAt`
- `PATCH /api/workouts-v2/[id]/complete` — marks the workout `COMPLETED` (+ `completedAt`); deletes the workout instead if it has no sets, and prunes exercises with zero sets

## Workout Mode UI (`/workouts/live`)
Client page with three phases: **setup** (pick exercises, choose a preset or custom rest duration, Start) → **active** (per-set inputs with a check button; completing a set persists it via the sets API and starts the rest countdown) → **finish** (complete API, redirect to /workouts). Details:
- Rest duration has 60/90/120-second quick picks plus any custom positive number of seconds, persisted locally; the timer renders as a fixed bottom bar (above `MobileFloatingNav`) with +15s and Skip and vibrates on finish where supported
- “Start Workout” and “Back to workouts” both flush setup drafts + completed sets to the in-progress workout; each set’s check control shows Save / Saving… / Saved / Retry so persistence is explicit
- “Back to workouts” saves completed sets, valid draft inputs, and selected exercise shells to the in-progress workout before navigating away
- Screen wake lock is requested during an active session (`navigator.wakeLock`, best-effort)
- Refreshing the page resumes the in-progress session (hydrated from `GET /api/workouts-v2/live`); the workouts page shows a "Resume" banner when one exists
- Entry points: "Start Workout" button on the workouts page and the dashboard quick-action card

## Exercise API
- `GET /api/exercises` — list all exercises for the current user (alphabetical)
- `POST /api/exercises` — body: `{ name: string, type?: 'WEIGHTED' | 'BODYWEIGHT' }` — create a new exercise (type defaults to WEIGHTED)
- `PATCH /api/exercises/[id]` — body: `{ name?, type? }` — rename and/or change type (duplicate names rejected)
- `DELETE /api/exercises/[id]` — permanently deletes the exercise and its cascaded set history; workouts left empty are removed
- `GET /api/exercise-history?exerciseId=` — returns historical WorkoutSets for an exercise, grouped by workout date

## Calories API notes
- `POST /api/calories` accepts optional `date` (YYYY-MM-DD) + `tz` (client `getTimezoneOffset()` minutes) for backdating: entries for a past day are pinned to the end of that local day; entries for today keep the real timestamp. `CalorieForm` always sends the calendar-selected date.

## Dashboard timezone handling
`PreferencesProvider` writes the client's `getTimezoneOffset()` to a `tz` cookie on mount. The dashboard Server Component reads it to compute "today"/"this week" boundaries in the user's local time (falls back to UTC when absent, e.g. first visit).

## Toast system
`ToastProvider` wraps the dashboard layout and exposes `{ toast }` via React context. Use `useToast()` in any client component within the dashboard to show notifications.

```ts
import { useToast } from '@/hooks/useToast';

const { toast } = useToast();
toast('Workout saved!', 'success');  // variants: 'success' | 'error' | 'info'
```

- Toasts auto-dismiss after 3.5 s; click to dismiss early
- Rendered in a fixed bottom-right stack with `animate-scale-in`
- No external library — implemented in `src/components/ui/ToastProvider.tsx`

## StatCard component
`StatCard` accepts optional `trend` and `progress` props in addition to the base `title / value / unit / subtitle`.

```ts
// Trend chip (↑/↓ with color coding)
trend?: {
  delta: number;          // positive or negative change
  label: string;          // e.g. 'vs yesterday'
  positiveDirection: 'up' | 'down' | 'neutral';
  // 'up'  → green when delta > 0
  // 'down' → green when delta < 0 (lower is better, e.g. weight)
  // 'neutral' → always gray
}

// Progress bar toward a goal
progress?: {
  current: number;
  goal: number;
  label?: string;   // e.g. 'Daily goal'
}
```

## Preferences system

`PreferencesProvider` (in `src/contexts/PreferencesContext.tsx`) wraps the dashboard layout and exposes preferences + setters via `usePreferences()`.

```ts
import { usePreferences } from '@/contexts/PreferencesContext';

const { preferences, setTheme, setUnits } = usePreferences();
// preferences.theme: 'light' | 'dark' | 'system'
// preferences.units.bodyWeight: 'kg' | 'lbs'
// preferences.units.liftingWeight: 'kg' | 'lbs'
// preferences.units.macros: 'g' | 'oz'
// preferences.units.calories: 'kcal' | 'Cal'

setTheme('system');                            // immediately applies DOM class + writes localStorage
setUnits({ bodyWeight: 'lbs' });              // partial update, persisted to localStorage
```

- Stored in `localStorage` key `healthengine_prefs` (JSON)
- `localStorage.theme` key is also kept in sync for the root layout inline script (FOUC prevention)
- Theme 'system' attaches a `matchMedia` listener so it updates live when OS preference changes
- **All DB values stay in base units** (kg, g, kcal) — only display and form entry convert
- Unit conversion helpers live in `src/lib/units.ts`:
  - `formatWeight(kg, unit)` / `formatWeightWithUnit(kg, unit)` — display
  - `formatMacro(g, unit)` / `formatMacroWithUnit(g, unit)` — display
  - `calorieUnitLabel(unit)` — `'kcal'` or `'Cal'` (no numeric conversion)
  - `weightInputToKg(input, unit)` / `macroInputToG(input, unit)` — form submit
  - `weightMaxForUnit(unit)` / `weightRangeLabel(unit)` — validation
  - `convertWeight(kg, unit)` / `convertMacro(g, unit)` — raw numeric conversion

## Charts system

recharts is installed for all data visualizations. Chart components live in `src/components/charts/`.

**Theme integration**: use `useChartColors()` hook — reads CSS custom properties from `document.documentElement` via `getComputedStyle`, and observes `class` attribute changes so charts update when dark/light mode is toggled.

**SSR guard**: all chart components use a `mounted` state (`useEffect(() => setMounted(true), [])`) so recharts only renders client-side. While unmounted, they render a skeleton (`bg-muted animate-pulse`).

| Component | Chart type | Data source | Page |
|---|---|---|---|
| `WeightChart` | AreaChart | `entries` prop (from weight page state) | Weight page |
| `CalorieBarChart` | BarChart | `GET /api/calories/summary?days=30` | Calories page |

**`/api/calories/summary`**: new route that returns `{ date, calories, protein, carbs, fat }[]` per day for the last N days. Used exclusively by `CalorieBarChart`.

## Dashboard page architecture
`dashboard/page.tsx` is a **Server Component** that fetches all data in a single `Promise.all` (using the `tz` cookie for local-day boundaries), then renders:
1. Header + email
2. `DashboardStats` (Client Component) — receives raw numbers; reads unit preferences; renders three stat cards + smart suggestions. Suggestions link to the relevant page. The weight card subtitle shows distance to the target weight goal when set.
3. Quick Actions — three full-width cards linking to /workouts/live, /calories, /weight
4. `GoalSetupCard` — full-width, shows goal chips when set; inline 3-col edit form when editing (validated client + server)

**Pattern for Server → Client with units:** Server components fetch numbers and pass them as plain props to a `'use client'` component, which calls `usePreferences()` to format for display. Never pass raw Prisma objects — extract and serialize fields explicitly.

## Workout input validation
All set fields are validated before submission in `AddWorkoutModal`, `EditWorkoutExerciseModal`, and the live Workout Mode page. Validation ranges adapt to the user's unit preference:
- Weight: 0–500 kg / 0–1102 lbs (uses `weightMaxForUnit` from `src/lib/units.ts`)
- Reps: 1–50 (required for bodyweight exercises)
- RPE (effort): 1–10
- Fully blank sets are rejected (at least one field per set)

The server mirrors these rules via `validateSets()` in `src/lib/workout-validation.ts` on every set write (POST, PATCH, live sets sync). Inputs also have HTML `min`/`max` attributes for browser-level hints.

## shadcn/ui component system

shadcn/ui (v4) is fully installed. **Never hand-roll UI primitives** — always use the installed shadcn components.

### Available components and import paths
```ts
import { Button } from '@/components/ui/button'
// variants: default | destructive | outline | secondary | ghost | link
// sizes: default | sm | lg | icon

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'  // always use cn() for conditional class merging
```

Custom (non-shadcn) components keep PascalCase: `StatCard.tsx`, `ToastProvider.tsx`, `GoalSetupCard.tsx`.

### Styling rules
- **All colors via CSS variables** — use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-muted`, `text-destructive`) not raw Tailwind color values on UI primitives.
- **Never use raw zinc/gray/white/black** on new components — these bypass the theme and break dark mode. Prefer `bg-background`, `bg-muted`, `text-foreground`, etc.
- **Variant mapping** (old → new): `primary` → `default`, `secondary` → `outline`, `danger` → `destructive`, size `md` → omit (default).
- **`cn()` for conditional classes**: always import and use `cn()` from `@/lib/utils` when merging class strings conditionally.
- **Interactive states**: rely on shadcn's built-in `hover:`, `focus-visible:`, `disabled:` styles — don't override them unless strictly necessary.
- **Custom interactive elements** (e.g. plain `<button>` used for small actions): style with `text-muted-foreground hover:text-foreground transition-colors` to stay consistent with the theme.
- **Forms**: always pair `<Label>` with `<Input>` / `<Textarea>` / `<Select>`. Never use unstyled inputs.
- **Dialogs**: use `Dialog` + `DialogContent` for modals. Structure as header / scrollable body / footer — see `AddWorkoutModal.tsx` as the reference pattern.
- **Delete actions**: use `variant="ghost"` with `hover:text-destructive hover:bg-destructive/10` — not `variant="destructive"` for inline list items. Reserve `variant="destructive"` for confirmation dialogs.

## Color system

Colors are defined as CSS variables in `globals.css` and consumed via shadcn semantic tokens. Prefer tokens over raw values.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` / `text-primary` | violet-600 | violet-500 | Buttons, active nav, brand accent |
| `--background` / `bg-background` | white | zinc-950 | Page background |
| `--card` / `bg-card` | white | zinc-900 | Card surfaces |
| `--muted` / `bg-muted` | zinc-100 | zinc-800 | Subtle backgrounds |
| `--muted-foreground` / `text-muted-foreground` | zinc-500 | zinc-400 | Secondary text |
| `--border` / `border-border` | zinc-200 | zinc-800 | All borders |
| `--destructive` / `text-destructive` | red-600 | red-400 | Errors, delete actions |
| `--success` / `text-success` | green-600 | green-400 | Positive trends, goal completion, success toasts |

- **Dark mode**: toggled via `class` strategy. Inline script in `layout.tsx` reads `localStorage.theme` before first paint to prevent flash. Theme is changed from the Settings page.
- **Stat cards**: left accent bar (`w-1.5 bg-primary`), `text-primary` value text at `text-4xl sm:text-6xl font-black`.
- **Raw Tailwind color values** (`violet-600`, `zinc-950`, etc.) are only acceptable in `globals.css` variable definitions and in one-off decorative elements (e.g. a gradient). Everywhere else use semantic tokens.

## Animation system

Three utility classes are defined in `globals.css` and automatically disabled for users with `prefers-reduced-motion: reduce`.

| Class | Keyframe | Duration | Easing | Use |
|---|---|---|---|---|
| `animate-fade-in-up` | opacity 0→1, translateY 10px→0 | 450ms | ease-out-quint | Page headings, stat cards, content entrances |
| `animate-fade-in` | opacity 0→1 | 250ms | ease-out | Context switches (date change, month change) |
| `animate-scale-in` | opacity 0→1, scale 0.97→1 | 300ms | ease-out-quint | Modals, new exercise/set rows appearing |

**Stagger pattern**: use inline `style={{ animationDelay: '120ms' }}` on sibling elements. Dashboard stat cards use 80ms / 180ms / 280ms. Exercise cards in WorkoutDayView use 0 / 60ms / 120ms per card.

**Key-based re-animation**: wrap content in a div with `key={someChangingValue}` to force React to remount and replay the animation when data changes (e.g. `key={date}` in WorkoutDayView, `key={year-month}` in CalendarView).

**Never animate**: layout properties (width, height, top, left) — always use `transform` and `opacity` for GPU acceleration.

## Typography conventions
- **Page headings**: `text-3xl sm:text-5xl font-black tracking-tight leading-none`
- **Section labels**: `text-[10px] font-bold text-muted-foreground uppercase tracking-widest`
- **Stat values**: `text-4xl sm:text-6xl font-black text-primary leading-none tracking-tight`
- **Exercise names in logs**: `text-base font-bold`
- **Data columns headers**: `text-[10px] font-bold text-muted-foreground uppercase tracking-wider`
- **Nav brand**: `font-black text-xl`

## Component rules
- **Mobile-first always**: Every component must work on both desktop and mobile. Use Tailwind responsive prefixes (`sm:`, `md:`) mobile-first — default styles target small screens, larger breakpoints override upward.
- **No fixed-width grids on mobile**: Multi-column grids must stack on mobile. Use `grid-cols-1 sm:grid-cols-N`, never `grid-cols-N` alone for forms or content layouts.
- **Responsive text**: Large display text must scale down. Use `text-2xl sm:text-3xl` patterns — never `text-3xl` or above without a smaller mobile base.
- **Responsive padding**: Cards and containers use `p-4 sm:p-6`, not fixed `p-6` or `p-8` alone.
- **Navigation**: On mobile the primary navigation is `MobileFloatingNav` (bottom tab bar); `TopNav` shows only the logo. Do not add inline nav items that would overflow on small screens. Fixed bottom UI (e.g. the live rest-timer bar) must sit above the floating nav (`bottom-24 sm:bottom-6`).
- **Touch targets**: Interactive elements (buttons, links) must be at least 44px tall on mobile. Use `py-2` or `py-3` on touch controls.
- **`max-w-*` containers**: Never use `max-w-xs` alone as a width constraint on content — wrap with `sm:max-w-xs` so it goes full-width on mobile.
- **Dark mode on all new components**: Use semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.) so dark mode is automatic. If you must use a raw Tailwind color, always pair it with a `dark:` counterpart. Never use `border-black`, `text-black`, `bg-white`, or `text-gray-*` alone.
- **Server → Client prop serialization**: When a Server Component passes Prisma model data to a Client Component, extract and pass only the needed fields as a plain object — never pass the raw Prisma result (it contains `Date` objects that conflict with TS string types in shared interfaces).

## PWA (Progressive Web App)

The app is configured as a PWA for iOS Safari "Add to Home Screen" and Android Chrome.

**Files:**
- `public/manifest.json` — Web App Manifest (name, icons, theme color, display mode)
- `src/components/ui/SplashScreen.tsx` — Logo splash overlay shown on PWA launch only (detects `display-mode: standalone` / `navigator.standalone`)
- `src/app/layout.tsx` — exports `viewport` (with `viewportFit: 'cover'`) + `metadata.appleWebApp` + `metadata.manifest`

**Key settings:**
- `display: "standalone"` in manifest — removes browser chrome when launched from home screen
- `appleWebApp.statusBarStyle: "black-translucent"` — status bar overlays the app (full-bleed)
- `viewportFit: "cover"` — content extends behind notch / Dynamic Island
- `themeColor: "#7c3aed"` — violet-600, tints browser chrome on Android
- Icons: uses `public/logo.png` — for best results the icon should be 512×512 PNG; iOS crops to a rounded square automatically

**To improve icon quality:** replace `public/logo.png` with a 512×512 version. iOS also benefits from a separate `public/apple-touch-icon.png` at 180×180.

## Production database
The schema already uses `provider = "postgresql"`. For production:
1. Set `DATABASE_URL` to your hosted Postgres URL (e.g. Neon)
2. Run `prisma migrate deploy` (or your host's migrate step) against that database
3. Use a strong `SESSION_SECRET` (min 32 chars)

Local Docker Postgres credentials (from `docker-compose.yml`): `postgresql://postgres:password@localhost:5432/healthengine`

## Enabling Resend (real email)
`resend` is already installed. Set these env vars:
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
The `from` address must match a domain verified in the Resend dashboard.

**Domain verification** (add DNS records shown in Resend dashboard → Domains):
- TXT `resend._domainkey` — DKIM signing key
- TXT `@` — SPF record
- CNAME `em.yourdomain.com` — bounce tracking (optional)

`sendVerificationEmail()` auto-detects `RESEND_API_KEY` and switches from the console mock to real sending.

## Environment variables
| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | yes | PostgreSQL connection string (local Docker or hosted) |
| SESSION_SECRET | yes | Min 32 chars, used to encrypt session cookies |
| NEXT_PUBLIC_APP_URL | no | Used for absolute URLs |
| RESEND_API_KEY | prod only | Resend API key (`re_...`) |
| RESEND_FROM_EMAIL | prod only | From address — must match verified Resend domain |
