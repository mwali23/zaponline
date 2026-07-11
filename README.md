# ZAP — Zambia's Access to Power

ZAP is a community power-intelligence and energy-services platform for Zambia. It combines confidence-weighted outage reports, local alerts, a provider marketplace, and transparent NGO/community energy projects in one responsive web application.

This repository replaces the original Leaflet-only proof of concept with a production-shaped Next.js application. The original static files remain in `legacy-prototype/` for history.

## Product surfaces

- **Power intelligence:** district map, recent community reports, confirmations, confidence scores, saved areas and alerts.
- **Energy marketplace:** verified provider profiles, service listings, requests, proposals, documented orders, payments and authentic reviews.
- **Provider workspace:** onboarding, verification, service areas, quote and job management, payment readiness and reputation.
- **ZAP Impact:** NGO/community projects, funding goals, milestone evidence, beneficiary reporting and sponsor updates.
- **Accounts and safety:** Supabase Auth, database-enforced row-level security, scoped locations, moderation states and audit-ready payment events.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Web | Next.js App Router + TypeScript | One deployable application with server routes and strong SEO |
| Data/Auth | Supabase (open-source Postgres, Auth, Storage, Realtime) | Portable backend with SQL migrations and row-level security |
| Maps | Leaflet + OpenStreetMap | Open mapping stack; current Copperbelt GeoJSON is retained |
| Payments | Provider adapter; Stripe Checkout implemented for impact donations | Keeps marketplace logic independent from payment geography |
| Hosting | Vercel or any Node-compatible host; Supabase Cloud or self-hosted | Fast initial operations without locking the database to the web host |

## Important payment constraint

Stripe is **not currently listed as a self-serve supported country for Zambian businesses**, and Stripe's self-serve cross-border Connect payout documentation limits the standard regions it supports. Do not launch a Zambia provider-payout flow on the assumption that Stripe Connect will onboard local sellers. See [Stripe global availability](https://stripe.com/global) and [Stripe cross-border payout availability](https://docs.stripe.com/connect/cross-border-payouts).

The code therefore:

- implements Stripe Checkout only for eligible platform/impact donation flows;
- keeps payment records provider-neutral (`stripe`, `mobile_money`, `bank`, `manual`);
- exposes a `PaymentGateway` interface for a licensed local or mobile-money processor;
- does not pretend to escrow funds—legal/payment counsel must decide merchant-of-record, safeguarding and payout responsibilities.

## Run locally

Requirements: Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The interface runs in demonstration mode without environment variables. Sign-in, persistence and checkout become active after configuring `.env.local`.

### Supabase

1. Create a Supabase project or run Supabase locally.
2. In the Supabase SQL editor, copy and run `supabase/migrations/202606280001_initial_platform.sql`.
3. Optionally copy and run `supabase/seed.sql` for Copperbelt demonstration districts.
4. Copy and run `supabase/migrations/202607100001_lifecycle_views.sql` so public pages only read active reports/listings.
5. Add the Supabase URL and keys to `.env.local`.
6. Add your production URL to Supabase Auth redirect URLs.

The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` or expose it to browser code.

### Lifecycle and archiving

- Power reports are visible only while `moderation_state = 'published'`, `archived_at is null`, and `expires_at > now()`.
- Public map panels read from `current_district_power_status`, which aggregates only active reports.
- Marketplace pages read from `available_service_listings`, which only returns verified provider listings where `is_active = true`, `archived_at is null`, and `available_until` has not passed.
- Service requests should move through `open -> matched -> in_progress -> completed` or `cancelled`; completed/cancelled requests are archived by `archive_expired_records()`.
- Run `select public.archive_expired_records();` manually from the SQL editor, or schedule it with Supabase cron/Edge Functions, to stamp expired/completed rows as archived while preserving history.

### Stripe donations

1. Add Stripe test keys and a webhook secret.
2. Point a webhook at `/api/payments/stripe/webhook`.
3. Subscribe to `checkout.session.completed`.
4. Test with a supported platform entity and settlement configuration.

Marketplace provider payments remain intentionally unbound until ZAP selects a licensed Zambia-compatible processor.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Repository map

```text
src/app/                 Routes, pages, auth callback and payment webhooks
src/components/          Shared UI, map and forms
src/lib/                 Demo data, Supabase clients and payment adapter
supabase/migrations/     Versioned database schema and RLS policies
supabase/seed.sql        Initial Copperbelt district records
public/                  Public map data
docs/                    Architecture, trust and launch guidance
legacy-prototype/        Original static proof of concept
```

## Before a real launch

- Obtain Zambian legal review for consumer protection, data protection, marketplace liability, payments and fundraising.
- Select and contract a locally supported payment/mobile-money processor.
- Replace sample marketplace/report/project data with controlled onboarding and moderation.
- Add transactional email/SMS, rate limiting, bot protection, observability and backups.
- Validate district boundaries and utility schedules with authoritative partners.
- Run provider verification and dispute-resolution pilots before broad paid acquisition.

See [architecture](docs/architecture.md) and the [launch plan](docs/launch-plan.md) for the operating model and rollout sequence.
