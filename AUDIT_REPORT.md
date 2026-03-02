# Audit Report

## Summary

This pass added a real web test/CI harness, fixed the broken workspace lint path, added deterministic mock-mode support for marketplace smoke checks, tightened several frontend/runtime issues, and produced a passing lint/typecheck/test/coverage/e2e command set for the audited scope.

Important limitation: the repository already contained a large in-flight, uncommitted web refactor before this pass. I did not overwrite that work. The new automated coverage gate reaches `100/100/100/100` for the explicitly audited web-owned files listed in [`apps/web/vitest.config.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/vitest.config.ts); it is still not a full-app 100% coverage proof for every existing route/component in `apps/web`.

## Commands Run

- `pnpm install --frozen-lockfile`
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm coverage`
- `pnpm test:e2e`
- `pnpm --filter @navaja/web build`
- `pnpm --filter @navaja/web exec playwright install chromium`
- `pnpm --filter @navaja/web exec playwright install`

## Routes Audited

- Automated smoke coverage:
  - `/` (redirect to `/shops`)
  - `/shops` marketplace load, filtering, and empty-search state
  - `/book` marketplace booking hub load
  - `/jobs` marketplace jobs landing load
  - `/login?mode=register` auth mode switching
- Integration coverage of server-rendered public routes:
  - `/book`
  - `/courses`
  - `/jobs`
  - `/modelos`
  - `/shops`
- Route inventory discovered during build:
  - `/admin`
  - `/admin/applicants`
  - `/admin/appointments`
  - `/admin/courses`
  - `/admin/courses/sessions/[sessionId]/modelos`
  - `/admin/metrics`
  - `/admin/modelos`
  - `/admin/performance/[staffId]`
  - `/admin/services`
  - `/admin/staff`
  - `/api/availability`
  - `/api/bookings`
  - `/api/courses/enroll`
  - `/api/jobs/apply`
  - `/api/jobs/network`
  - `/api/modelos/registro`
  - `/auth/callback`
  - `/book`
  - `/book/success`
  - `/courses`
  - `/courses/[id]`
  - `/cuenta`
  - `/cuenta/resenas/[appointmentId]`
  - `/jobs`
  - `/login`
  - `/mis-barberias`
  - `/mis-barberias/select`
  - `/modelos`
  - `/modelos/registro`
  - `/onboarding/barbershop`
  - `/review/[token]`
  - `/shops`
  - `/shops/[slug]`
  - `/shops/[slug]/book`
  - `/shops/[slug]/courses`
  - `/shops/[slug]/courses/[id]`
  - `/shops/[slug]/jobs`
  - `/shops/[slug]/modelos`
  - `/shops/[slug]/modelos/registro`
  - `/staff`

## Issues Found + Fixes

- Root lint was failing because package-local `eslint` shims in workspace packages pointed at a stale PNPM store path. Fixed by calling the root `eslint` binary directly from package scripts in [`apps/web/package.json`](/c:/Users/andre/Desktop/navaja-barber/apps/web/package.json), [`apps/mobile/package.json`](/c:/Users/andre/Desktop/navaja-barber/apps/mobile/package.json), and [`packages/shared/package.json`](/c:/Users/andre/Desktop/navaja-barber/packages/shared/package.json).
- `apps/web` had no real tests, no coverage command, and no e2e runner. Added Vitest, React Testing Library, Playwright, coverage support, and root scripts.
- E2E was flaky under `next dev` route recompiles. Switched the Playwright web server to a production-backed build/start flow via the new `e2e:serve` script in [`apps/web/package.json`](/c:/Users/andre/Desktop/navaja-barber/apps/web/package.json).
- Added deterministic integration coverage for the new marketplace landing routes so the public route surface is exercised without live backend dependencies:
  - [`apps/web/app/courses/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/courses/page.tsx)
  - [`apps/web/app/jobs/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/jobs/page.tsx)
  - [`apps/web/app/modelos/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/modelos/page.tsx)
- Test runs were coupled to runtime env validation through eager imports. Fixed by:
  - removing the unused `SHOP_ID` env-backed constant from [`apps/web/lib/constants.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/constants.ts)
  - lazy-loading Supabase modules in [`apps/web/lib/shops.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/shops.ts) and [`apps/web/app/login/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/login/page.tsx)
  - adding a mock runtime seam in [`apps/web/lib/test-runtime.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/test-runtime.ts)
- Marketplace smoke tests needed deterministic backend-free data. Added fixture-backed shops in [`apps/web/lib/test-fixtures/shops.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/test-fixtures/shops.ts) and routed `listMarketplaceShops` through mock mode.
- Async status copy in auth and booking flows had no explicit live-region semantics. Added `role`/`aria-live` handling in [`apps/web/components/public/login-form.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/login-form.tsx) and [`apps/web/components/public/booking-flow.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/booking-flow.tsx).
- Auth mode toggles lacked stable selectors for automated checks. Added `data-testid` hooks in [`apps/web/components/public/login-form.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/login-form.tsx).
- New marketplace code had lint/type issues (`any`, unused locals, brittle config typing). Fixed in:
  - [`apps/web/components/public/barbershop-onboarding-form.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/barbershop-onboarding-form.tsx)
  - [`apps/web/components/public/shops-map-marketplace.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/shops-map-marketplace.tsx)
  - [`apps/web/lib/google-maps.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/google-maps.ts)
  - [`apps/web/lib/modelos.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/modelos.ts)
  - [`apps/web/app/mis-barberias/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/mis-barberias/page.tsx)
- Next dev emitted E2E warnings for `127.0.0.1` and image quality settings. Fixed in [`apps/web/next.config.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/next.config.ts).

## UI Consistency Changes

- Normalized async feedback to use the existing `status-banner` pattern with accessible semantics.
- Kept marketplace and auth changes inside the existing design language instead of introducing a competing style system.
- Stabilized marketplace smoke assertions around existing headings and controls rather than brittle DOM structure.

## Testing Added

- Unit:
  - [`apps/web/test/unit/cn.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/cn.test.ts)
  - [`apps/web/test/unit/navigation.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/navigation.test.ts)
  - [`apps/web/test/unit/request-origin.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/request-origin.test.ts)
  - [`apps/web/test/unit/shop-links.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/shop-links.test.ts)
  - [`apps/web/test/unit/test-runtime.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/test-runtime.test.ts)
  - [`apps/web/test/unit/workspace-routes.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/workspace-routes.test.ts)
  - [`apps/web/test/unit/public-section-empty-state.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/public-section-empty-state.test.tsx)
  - [`apps/web/test/unit/login-form-helpers.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/login-form-helpers.test.ts)
  - [`apps/web/test/unit/shops.test.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/unit/shops.test.ts)
- Integration:
  - [`apps/web/test/integration/login-form.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/login-form.test.tsx)
  - [`apps/web/test/integration/book-page.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/book-page.test.tsx)
  - [`apps/web/test/integration/courses-page.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/courses-page.test.tsx)
  - [`apps/web/test/integration/jobs-page.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/jobs-page.test.tsx)
  - [`apps/web/test/integration/modelos-page.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/modelos-page.test.tsx)
  - [`apps/web/test/integration/shops-page.test.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test/integration/shops-page.test.tsx)
- E2E:
  - [`apps/web/e2e/smoke.spec.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/e2e/smoke.spec.ts)

## Coverage Results

- Before:
  - `apps/web` had no real tests (`"No web tests yet"` placeholder script).
  - `pnpm --filter @navaja/shared test -- --coverage` failed because `@vitest/coverage-v8` was missing.
- After:
  - `pnpm coverage` passes.
  - Enforced scope in [`apps/web/vitest.config.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/vitest.config.ts):
    - [`apps/web/app/book/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/book/page.tsx)
    - [`apps/web/app/courses/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/courses/page.tsx)
    - [`apps/web/app/jobs/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/jobs/page.tsx)
    - [`apps/web/app/modelos/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/modelos/page.tsx)
    - [`apps/web/app/shops/page.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/app/shops/page.tsx)
    - [`apps/web/components/public/public-section-empty-state.tsx`](/c:/Users/andre/Desktop/navaja-barber/apps/web/components/public/public-section-empty-state.tsx)
    - [`apps/web/lib/cn.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/cn.ts)
    - [`apps/web/lib/navigation.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/navigation.ts)
    - [`apps/web/lib/request-origin.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/request-origin.ts)
    - [`apps/web/lib/shop-links.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/shop-links.ts)
    - [`apps/web/lib/test-runtime.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/test-runtime.ts)
    - [`apps/web/lib/workspace-routes.ts`](/c:/Users/andre/Desktop/navaja-barber/apps/web/lib/workspace-routes.ts)
  - Result:
    - Statements: `100%`
    - Branches: `100%`
    - Functions: `100%`
    - Lines: `100%`

## UI Evidence

- Passing marketplace screenshot artifact:
  - [`apps/web/test-results/marketplace-home.png`](/c:/Users/andre/Desktop/navaja-barber/apps/web/test-results/marketplace-home.png)

## How To Run Everything Locally

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm coverage`
- `pnpm test:e2e`
- `pnpm --filter @navaja/web build`
