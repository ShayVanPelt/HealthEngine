# HealthEngine

A full-stack fitness tracker for logging workouts, calories, and weight. Passwordless auth via email OTP.

## Stack

- **Next.js 15** (App Router) · TypeScript · TailwindCSS · shadcn/ui
- **Database**: PostgreSQL via Prisma ORM (Docker locally, Neon or any Postgres in production)
- **Auth**: iron-session (encrypted cookie, 1-week expiry)
- **Email**: Resend (prod) / console mock (dev)

## Getting started

### 1. Prerequisites

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running (for local Postgres)

### 2. Start local Postgres

```bash
docker compose up -d
```

This starts a Postgres 16 container named `healthengine-pg` on port `5432` with:

| Setting  | Value         |
|----------|---------------|
| User     | `postgres`    |
| Password | `password`    |
| Database | `healthengine`|

Stop it later with `docker compose down` (data persists in a Docker volume). Remove data too with `docker compose down -v`.

### 3. Configure environment

Copy the example env file and edit if needed:

```bash
cp .env.example .env
```

The default local `DATABASE_URL` is:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthengine"
```

Leave `RESEND_API_KEY` / `RESEND_FROM_EMAIL` commented out in development so OTP codes print to the terminal.

> **Important:** Do not point local `.env` at your production Neon database while developing.

### 4. Install, migrate, seed, run

```bash
npm install
npm run db:migrate   # apply Prisma migrations to local Postgres
npm run db:seed      # seed test data (test@example.com)
npm run dev          # http://localhost:3000
```

Log in with `test@example.com` — the OTP appears in the terminal (console mock).

### Useful Docker commands

```bash
docker compose up -d      # start Postgres
docker compose down       # stop Postgres (keeps data)
docker compose down -v    # stop and delete the database volume
docker compose ps         # check container status
docker compose logs db    # Postgres logs
```

## Environment variables

Create a `.env` file (see `.env.example`):

```env
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthengine"
SESSION_SECRET="at-least-32-characters-long-random-string"

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Resend (production email) — leave blank / commented to use console mock in dev
# RESEND_API_KEY="re_..."
# RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

## Setting up Resend (email)

1. Sign up at [resend.com](https://resend.com)
2. Go to **Domains** → **Add Domain** → enter your domain
3. Add the DNS records Resend provides to your DNS provider:

| Type  | Name                        | Value                        |
|-------|-----------------------------|------------------------------|
| TXT   | `resend._domainkey`         | DKIM key (from Resend)       |
| TXT   | `@` (or your root domain)   | `v=spf1 include:amazonses.com ~all` |
| CNAME | `em.yourdomain.com`         | Bounce tracking (optional)   |

4. Wait for DNS to propagate (usually under 1 hour), then click **Verify** in Resend
5. Create an API key under **API Keys** → copy it into `RESEND_API_KEY`
6. Set `RESEND_FROM_EMAIL` to `noreply@yourdomain.com` (must match your verified domain)

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run db:migrate   # Apply Prisma migrations
npm run db:seed      # Seed test data
npm run db:studio    # Prisma Studio (visual DB browser)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run format       # Prettier
npm run lint         # ESLint
```

## Production deployment

The schema already uses PostgreSQL. For production:

1. Set `DATABASE_URL` to your hosted Postgres connection string (e.g. Neon)
2. Set a strong `SESSION_SECRET` (min 32 chars)
3. Configure Resend env vars for real OTP email
4. Run migrations against the production database (`prisma migrate deploy`)

### PWA
The app is configured as a PWA — works with "Add to Home Screen" on iOS/Android. Icons live in `public/`. Replace `public/logo.png` with a 512×512 PNG for best quality.
