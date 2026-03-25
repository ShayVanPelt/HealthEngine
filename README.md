# HealthEngine

A full-stack fitness tracker for logging workouts, calories, and weight. Passwordless auth via email OTP.

## Stack

- **Next.js 15** (App Router) · TypeScript · TailwindCSS · shadcn/ui
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Auth**: iron-session (encrypted cookie, 1-week expiry)
- **Email**: Resend (prod) / console mock (dev)

## Getting started

```bash
npm install
npm run db:migrate   # creates prisma/dev.db on first run
npm run db:seed      # seed test data (test@example.com)
npm run dev          # http://localhost:3000
```

## Environment variables

Create a `.env.local` file:

```env
# Required
DATABASE_URL="file:./dev.db"
SESSION_SECRET="at-least-32-characters-long-random-string"

# Resend (production email) — leave blank to use console mock in dev
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Optional
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
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

### Switch to PostgreSQL
1. Change `prisma/schema.prisma` datasource provider to `"postgresql"`
2. Set `DATABASE_URL="postgresql://..."` in env
3. Run `npm run db:migrate`

### PWA
The app is configured as a PWA — works with "Add to Home Screen" on iOS/Android. Icons live in `public/`. Replace `public/logo.png` with a 512×512 PNG for best quality.
