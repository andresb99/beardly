# Navaja Barber Platform

Navaja is a multi-surface barber shop platform built as a pnpm monorepo. It combines a public marketplace, online booking, internal shop operations, education flows, model calls, job applications, and business metrics in a single product.

The repository is structured to support both current product delivery and future commercialization through scalable plans and multi-tenant shop workspaces.

## What the product covers

Navaja centralizes workflows that are usually fragmented across several tools:

- Public shop discovery with map and marketplace flows
- Online booking and appointment management
- Staff operations, schedules, and time-off handling
- Customer account history, notifications, and reviews
- Courses, practice models, and hiring pipelines
- Business reporting for billing, utilization, and staff performance

In practice, the goal is simple: reduce manual operational overhead while improving booking conversion and decision-making.

## Surfaces

### Web

The web app includes:

- Public marketplace and tenant storefronts
- Booking flows
- Customer account flows
- Admin and staff workspaces
- Internal operational tooling

Location: `apps/web`

### Mobile

The mobile app mirrors the core business flows from web where applicable:

- Marketplace and booking access
- Account and review flows
- Admin and staff operational views
- Subscription and workspace-aware flows

Location: `apps/mobile`

### Shared package

Shared contracts live in `packages/shared` and are used to keep business behavior aligned across surfaces:

- Zod schemas
- Shared types
- Product configuration
- Subscription and marketing data
- Cross-platform helpers

## Monorepo layout

```text
apps/
  web/         Next.js web app
  mobile/      Expo / React Native app
packages/
  shared/      Shared contracts, types, helpers
supabase/
  migrations/  SQL migrations
  seed.sql     Optional seed data
docs/
```

## Tech stack

### Web

- Next.js 16
- React 19
- TypeScript
- HeroUI
- Tailwind CSS
- ApexCharts

### Mobile

- Expo 54
- React Native 0.81
- Expo Router
- HeroUI Native
- react-native-gifted-charts
- Uniwind

### Backend and platform

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Row Level Security (RLS)
- SQL migrations

### Tooling

- pnpm workspaces
- Turborepo
- Vitest
- Playwright
- ESLint
- Prettier

## Multi-tenant model

The platform is shop-centric. Each barber shop operates as a workspace.

Core concepts:

- `shop_id` and `shop_slug` identify the workspace
- `shop_memberships` define tenant membership and status
- Operational roles include `admin`, `staff`, and `user`
- Server-side checks and RLS policies protect tenant boundaries
- Mobile consumes web APIs where direct native access would diverge from business rules

This is important: business behavior should be consistent across web and mobile, but enforcement still happens server-side.

## Main functional areas

| Area | Purpose |
| --- | --- |
| Marketplace + map | Discover shops by viewport, location, or search |
| Booking | Create and manage appointments |
| Customer account | Notifications, history, and reviews |
| Staff operations | Agenda, availability, and time off |
| Admin operations | Staff, services, shop settings, notifications |
| Courses | Educational products and enrollments |
| Models | Practice model calls and applications |
| Jobs | Candidate intake and marketplace exposure |
| Metrics | Billing, occupancy, ticket size, performance |
| Subscriptions | Plan management and billing flows |

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- A Supabase project
- Optional: Supabase CLI

CI currently runs on Node 24, so using a recent Node version locally is recommended.

### Install dependencies

```bash
pnpm install
```

If pnpm asks for build approvals:

```bash
pnpm approve-builds
```

## Environment variables

Copy the example files first:

- `apps/web/.env.example` -> `apps/web/.env.local`
- `apps/mobile/.env.example` -> `apps/mobile/.env`

### Web

`apps/web/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REVIEW_LINK_SIGNING_SECRET=
NEXT_PUBLIC_SHOP_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Mobile

`apps/mobile/.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SHOP_ID=
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Notes:

- `EXPO_PUBLIC_API_BASE_URL` must point to the web app for API-backed flows such as account, booking, reviews, and subscriptions.
- `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` is used to resolve marketplace subdomains and protect reserved internal hosts.

## Database setup

### Option 1: Supabase SQL editor

1. Run the migrations from `supabase/migrations` in order.
2. Optionally run `supabase/seed.sql` for demo data.

### Option 2: Supabase CLI

```bash
supabase link --project-ref <project-ref>
supabase db push
psql "<postgres-connection-string>" -f supabase/seed.sql
```

## Local development

### Run the whole monorepo

```bash
pnpm dev
```

### Run only the web app

```bash
pnpm --filter @navaja/web dev
```

### Run only the mobile app

```bash
pnpm --filter @navaja/mobile dev
```

Useful mobile commands:

```bash
pnpm --filter @navaja/mobile android
pnpm --filter @navaja/mobile ios
pnpm --filter @navaja/mobile web
```

## Root scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run workspace dev scripts in parallel |
| `pnpm build` | Build the monorepo |
| `pnpm lint` | Run lint across workspaces |
| `pnpm typecheck` | Run TypeScript checks across workspaces |
| `pnpm test` | Run workspace test scripts |
| `pnpm test:unit` | Run web unit tests |
| `pnpm test:integration` | Run web integration tests |
| `pnpm test:e2e` | Run web Playwright tests |
| `pnpm coverage` | Run web coverage |
| `pnpm format` | Format the repository |

## Quality and testing

### Web

- Unit tests: Vitest
- Integration tests: Vitest + React Testing Library
- E2E tests: Playwright
- Coverage: Vitest V8 coverage

### Mobile

- Type checking and linting
- Vitest coverage for mobile-specific helpers and contracts where available

### Shared

- Vitest for shared logic and contracts

Current CI workflow runs:

- install
- Playwright browser setup
- lint
- typecheck
- coverage
- E2E

Workflow file: `.github/workflows/ci.yml`

## API and backend notes

The web app contains both App Router pages and API routes. Important areas include:

- booking and availability
- account notifications and reviews
- courses enrollment
- jobs and models
- onboarding and shop administration
- subscriptions and billing flows
- admin notification summaries and inbox endpoints

Business enforcement belongs on the server. Mobile should reuse those endpoints when the flow is business-critical.

## Data model overview

Core tables include:

- `shops`, `shop_memberships`, `shop_locations`, `subscriptions`
- `staff`, `working_hours`, `time_off`
- `services`, `customers`, `appointments`
- `appointment_reviews`, `review_invites`, `account_notifications`
- `courses`, `course_sessions`, `course_enrollments`
- `models`, `model_requirements`, `model_applications`, `waivers`
- `job_applications`, `marketplace_job_profiles`, `marketplace_models`
- `user_profiles`, `shop_gallery_images`

Storage buckets currently include:

- `cvs` for private candidate files
- `public-assets` for public-facing assets

## Maps, payments, and regional assumptions

- Visible product currency: `UYU`
- Formatting locale: `es-UY`
- Internal monetary persistence uses `*_cents` fields
- Maps require Google Maps keys on both web and mobile
- Mercado Pago flows are integrated into checkout and subscription logic

## Deployment

### Web

The web app is intended to be deployed on Vercel.

Basic steps:

1. Import the repository
2. Set the root directory to `apps/web`
3. Configure web environment variables
4. Deploy

For custom tenant domains, review the domain flow and DNS requirements in `docs/custom-domains.md`.

### Mobile

The mobile app is intended for Expo / EAS builds.

```bash
pnpm --filter @navaja/mobile exec eas build --platform ios --profile production
pnpm --filter @navaja/mobile exec eas build --platform android --profile production
```

## Development principles for this repo

- Keep business logic aligned across web and mobile
- Prefer shared contracts over duplicated payload shapes
- Treat the web backend as the source of truth for protected business flows
- Preserve tenant isolation through RLS and server checks
- Avoid introducing temporary workspace artifacts into version control

## Status

This repository already contains the foundations for a production SaaS product:

- public acquisition flows
- operational admin/staff tooling
- mobile parity work
- subscription and billing foundations
- automated test coverage in CI

The repo is not just a landing or booking MVP. It is structured to keep growing into a commercial multi-tenant barber platform.
