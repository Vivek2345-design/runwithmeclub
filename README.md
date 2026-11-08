# RunWithMeClub

A complete running-club website and management platform: public site, member app and admin area.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind 4, Prisma 6 (SQLite locally, Postgres in production), zod, lucide icons.

## What's in it

**Public site** - home (live club stats), about, events (RSVP, waitlist, add-to-calendar), training programs, public leaderboard, news, membership plans, FAQ, contact form, privacy / terms / code of conduct, SEO (metadata, sitemap, robots, Open Graph image, event structured data), dark and light themes.

**Member area** - dashboard (fitness / fatigue / form, weekly volume, streak), activity log (manual entry and GPX upload), calendar, coach-assigned training plan, my events, challenges, goals with progress rings, personal records, announcements, profile (details, heart-rate/FTP settings, password, optional Strava, delete account).

**Admin area (roles: ADMIN, COACH)** - club overview, members (search, filters, CSV export, plan and membership dates, pace groups, private notes, suspend, role changes, one-time password reset, delete), events (create/edit, registrations, waitlist promotion, check-in, attendee CSV), training plans (assign to one member, a pace group, or everyone), pace groups, challenges, announcements (members only or public), contact inbox.

**Optional Strava** - members can link Strava in their profile; the site works fully without it.

## Run locally

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # if node is not on your PATH
npm install
npm run seed                                  # demo data; logins are written to .dev-credentials.txt
npm run dev                                   # starts a local Postgres + the site at http://localhost:3000
```

No Docker or Postgres install is needed: `npm run dev` runs an embedded local Postgres (data in `.pgdata/`, port 54329). Production uses Railway's managed Postgres.

`npm run seed` wipes the **local** database and loads sample members, runs, events and a challenge. It refuses to run against any non-local database. **Sample data only.**
To start clean with your own data: `node --env-file=.env scripts/seed-dev.mjs --clear`, then sign up. The first account on an empty database becomes the admin.

In development, emails (password reset, welcome, event confirmations) are printed to the terminal running `npm run dev` instead of being sent.

New database migration after editing `prisma/schema.prisma`: `npm run db:migrate -- --name what_changed`.

## Checks

```bash
npm test          # 49 tests: metrics, GPX, auth, CSV, events/waitlist, reset tokens, Strava sync (real Postgres)
npm run typecheck
npm run lint
npm run build
```

## Make it yours (edit before launch)

- `src/lib/brand.ts` - name, tagline, contact email, **membership plan names and prices (currently placeholders)**.
- `src/lib/programs.ts` - the training programs shown on the site.
- `src/app/(site)/faq/page.tsx` - FAQ answers. `about/page.tsx` - values and story.
- Legal pages (`privacy`, `terms`, `conduct`) are **templates**: have a lawyer review them (India's DPDP Act applies).

## Going live

See **[DEPLOY.md](DEPLOY.md)** for the step-by-step Railway guide (GitHub, Postgres, domain `runwithme.club`, Resend email, first admin, backups, monitoring).
