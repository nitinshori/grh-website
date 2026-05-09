# GRH Website — Project Context

> **COMMIT THIS FILE:** `git add CLAUDE.md && git commit -m "Add CLAUDE.md project context" && git push`
> Cowork reads this automatically when you open the project folder.

## What This Is

Get Real Health (GRH) is a pharmacy services platform at **getrealhealthpgd.co.uk**. It provides PGD (Patient Group Direction) governance, a consultation tool, appointment diary with online booking, training, and superintendent oversight — all in one product for UK community pharmacies. Deployed on Vercel, backed by Neon PostgreSQL.

Owner: Nitin Shori (nitinshori@me.com) — founder, Medical Director background (ex-Pharmacy2U).

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS 4
- **Database:** Neon serverless PostgreSQL via Drizzle ORM
- **Auth:** NextAuth 5 (beta) with Drizzle adapter, bcryptjs
- **Email:** Resend
- **Calendar:** Google Calendar API (discovery calls + appointment sync)
- **Voice:** Vapi AI receptionist (handles inbound calls, books appointments)
- **File storage:** Vercel Blob
- **Hosting:** Vercel (auto-deploy from `main` branch sometimes flaky — use `npx -y vercel --prod` as fallback)

## Key Commands

```bash
npm run dev          # Local dev server
npm run build        # Production build
npx -y vercel --prod # Manual production deploy
```

## Database

Neon serverless PostgreSQL. Schema at `src/lib/db/schema.ts`. Key tables:

- **pharmacies** — Multi-tenant. Each pharmacy has a `groupSlug` (for white-label booking pages) and can have multiple sites.
- **users** — Roles: super_admin, pharmacy_admin, pharmacist, client
- **appointment_types** — Per-group. Name, duration, requiresDetails flag.
- **clinicians** — Per-group. Name, role, GPhC number.
- **clinician_availability** — Per-clinician per-site. Day of week + start/end time.
- **appointments** — Bookings. Status: available/booked/completed/cancelled/no_show. Tracks patient details, consent, online vs staff-booked.
- **pharmacy_pgds** — Which PGDs are assigned to which pharmacy.
- **pgd_consultations** — Audit trail for clinical consultations.
- **voice_calls** — Vapi AI call logs and transcripts.

Migration scripts are in `scripts/` — use `node scripts/run-booking-migration.mjs` for the booking system tables. Note: Neon driver requires `sql.query(stmt)` not `sql(stmt)`.

## Site Architecture

### Public Marketing Pages
- `/` — Homepage
- `/for-pharmacies` — Why partner with us (landing)
- `/for-pharmacies/platform` — Platform features (consultation, booking, PMR positioning)
- `/for-pharmacies/pgd-catalogue` — Interactive PGD catalogue (60+ services)
- `/for-pharmacies/pricing` — Pricing tiers + savings calculator
- `/for-patients` — Patient service finder
- `/about`, `/contact`, `/resources`

### Authenticated Areas
- `/login` — Auth entry
- `/for-pharmacies/dashboard` — Pharmacy admin (PGDs, appointments, settings)
- `/admin` — Super admin (pharmacies, users, voice calls)
- `/client/[slug]` — Client-specific portal

### Booking System (White-Label)
- `/book` — GRH discovery call booking
- `/book/[slug]` — White-label pharmacy booking page (e.g. `/book/pritchards`)
  - Layout hides main site header/footer via CSS
  - Server component fetches all data (sites, types, clinicians, slots)
  - Progressive enhancement: all buttons are `<a>` tags with query param fallbacks so the page works without JavaScript (critical — JS hydration fails on some machines)
  - Flow: Location → Service → Date/Time → Patient Details → Confirmed
  - Query params: `?site=ID&type=ID&date=YYYY-MM-DD&slot=ISO&clinician=ID`

### API Routes
- `/api/booking/[slug]/services` — Public: sites, types, clinicians for a group
- `/api/booking/[slug]/slots` — Public: available time slots for a date
- `/api/booking/[slug]/confirm` — Public: book an appointment (conflict detection)
- `/api/appointments/*` — Authenticated: admin CRUD, availability, analytics
- `/api/voice/*` — Vapi webhook + tool endpoints
- `/api/book/*` — Discovery call booking (Google Calendar)
- `/api/admin/*` — Admin management endpoints

## Current Clients

### Pritchard's Pharmacy (groupSlug: "pritchards")
- Two sites: Meliden and Victoria Road (Prestatyn)
- Booking page: getrealhealthpgd.co.uk/book/pritchards
- Appointment types: NHS Flu Vaccination, Travel Consultation, Private Prescription, Weight Management, Emergency Contraception, General Health Consultation
- Clinicians seeded in DB with weekly availability

## Important Patterns

1. **Progressive enhancement on booking pages** — Every interactive element uses `<a href="...">` with query params. JavaScript enhances with `onClick + preventDefault` for SPA feel. This is non-negotiable — JS hydration fails on some client machines.

2. **White-label branding** — Booking pages use `brandColor` and `brandName` from the pharmacy record. No GRH branding visible except "Powered by" footer.

3. **Server-side data loading** — The booking page.tsx fetches everything server-side (sites, types, clinicians, and even slots if date is in URL). No client-side loading states for initial data.

4. **Deployment** — GitHub repo: `nitinshori/grh-website`. Vercel auto-deploy from main is unreliable. Manual deploy with `npx -y vercel --prod` from the project directory.

5. **Git lock files** — The repo occasionally gets stale `.git/index.lock` files. Run `rm -f .git/index.lock` before git operations if you hit errors.

## Environment Variables (Vercel + .env.local)

```
DATABASE_URL              # Neon PostgreSQL connection string
NEXTAUTH_SECRET           # Auth encryption key
NEXTAUTH_URL              # https://getrealhealthpgd.co.uk
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
GOOGLE_CALENDAR_REFRESH_TOKEN
GOOGLE_CALENDAR_ID
VOICE_NOTIFY_EMAIL        # Admin notification email
VAPI_TOOLS_SECRET         # Vapi AI auth
VAPI_WEBHOOK_SECRET       # Vapi webhook verification
NEXT_PUBLIC_GA_MEASUREMENT_ID  # Google Analytics (optional)
```

## Recent Work (May 2025)

- Built full multi-site appointment booking system (schema, APIs, UI)
- Onboarded Pritchard's Pharmacy as first booking client
- Fixed JS hydration issues with progressive enhancement (`<a>` tag fallbacks)
- Updated platform marketing pages for pharmacy-side booking, availability setup, website integration, and PMR positioning
- Ongoing: Pritchard's evaluating for demo, discussing pricing and PMR integration needs
