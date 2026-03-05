# Branch Comparison Report

**Date:** 2026-03-05
**Branches:** `adjustments-190126` vs `main`
**Runtime:** Bun v1.3.10

---

## Branch Comparison Table

| Command | adjustments-190126 | main |
|---|---|---|
| `bun install` | OK (605 packages) | OK (1046 packages) |
| `bunx prisma generate` | OK (v6.19.1) | OK (v6.19.1) |
| **Web lint** (`bun run --cwd apps/web lint`) | FAIL - 22 problems (21 errors, 1 warning) | FAIL - 1715 problems (1704 from dist/ bundle, 11 source) |
| **Web typecheck** (`bun run --cwd apps/web typecheck`) | FAIL - 72 errors in 10 files | PASS - 0 errors |
| **Web build** (`bun run --cwd apps/web build`) | PASS (4.04s, 2445 modules) | PASS (2.97s, 737 modules) |
| **API lint** (`bun run --cwd apps/api lint`) | FAIL - 40 errors | FAIL - 27 errors |
| **API typecheck** (`bun run --cwd apps/api typecheck`) | FAIL - 37 errors in 13 files | FAIL - 31 errors in 10 files |
| **API dev** (`bun run --cwd apps/api dev`) | PASS (boots, JSON structured logging) | PASS (boots, "Elysia is running") |
| **API tests** (`bun test`) | PASS - 14 tests, 0 failures | N/A - no test files on main |

---

## Baseline Failures (same on both branches)

These failures exist on both branches and are pre-existing:

- **API lint:** Both branches fail. Shared errors in ingestion files (ab-api.ts, ab-auto.ts, ab-scraper.ts, ab/discovery.ts, ab/index.ts, sklavenitis/index.ts, sync-ab.ts). Mostly `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars`.
- **API typecheck:** Both branches fail. Shared errors in dump-ab-file.ts, dump-ab.ts, force-ab.ts, ingestion/ab-api.ts, ab-auto.ts, ab-scraper.ts, ab/index.ts, service.ts, sklavenitis/index.ts, sync-ab.ts.
- **Web lint: postcss.config.cjs** `module is not defined` error exists on both.

---

## Regressions (fail on adjustments-190126, pass on main)

- **Web typecheck:** 72 type errors on adjustments-190126 vs 0 on main. This is a **major regression**. Key issues:
  - `BasketSidebar.tsx` (21 errors): Properties not found on type `unknown` from `useStore`; missing `onTogglePin`, `onClose`, `onUpdateQty`, `onRemove` identifiers; implicit `any` types.
  - `StoreFilters.tsx` (9 errors): Properties not found on type `unknown` from `useStore`; `enabledStores` undefined; `shallow` call signature mismatch.
  - `BasketAnalysisPage.tsx` (13 errors): Same `useStore` unknown type pattern; implicit `any` in `.map()` and `.reduce()` callbacks.
  - `HomePage.tsx` (12 errors): Same `useStore` pattern; `parseFloat` given `number` instead of `string`; `ProductCard` missing required props.
  - `ProductDetailsPage.tsx` (4 errors): Same `useStore` pattern.
  - `store.ts` (1 error): `StateCreator` type mismatch with `subscribeWithSelector`/`persist` middleware composition.
  - `ComparisonView.tsx` (3 errors): Type mismatch between `BasketItemUI[]` and `BasketItem[]`; `unknown` not assignable to `ReactNode`.
  - `ProductSearch.tsx` (3 errors): `Map` constructor type mismatch; operator `>` on `{}`.
  - `useProductSearch.ts` (3 errors): `setResults` undefined (not in store).
  - `AISuggestionsPanel.test.tsx` (3 errors): Missing `vitest` and `@testing-library/react` type declarations.

- **API lint:** 40 errors on adjustments-190126 vs 27 on main (+13 new errors). New errors come from:
  - `src/ai/rateLimit.middleware.ts` (2 errors, new file)
  - `src/ai/suggestions.service.ts` (1 error, new file)
  - `src/middleware/rateLimitMiddleware.ts` (2 errors, new file)
  - `src/routes/ai-suggestions.route.ts` (1 error, new file)
  - `src/routes/ai.route.ts` (1 error, new file)
  - `src/routes/basket.route.ts` (1 error, new file)
  - `src/services/basket.service.ts` (2 errors, new file)
  - `src/services/ekatanalotisService.ts` (1 error, new file)
  - `src/services/embeddingSuggestionsService.ts` (3 errors, new file)
  - Note: `sync-ekatanalotis.ts` was renamed to `sync-ekatanalotis-OLD.ts`

- **API typecheck:** 37 errors on adjustments-190126 vs 31 on main (+6 new errors). New error sources:
  - `src/ai/suggestions.test.ts` (3 errors, new file)
  - `src/routes/ai-suggestions.route.ts` (2 errors, new file)
  - `src/routes/ai.route.ts` (1 error, new file)

---

## Improvements (pass on adjustments-190126, fail on main)

- **Web lint source errors:** Excluding the dist/ bundle (1704 errors on main from committed build artifacts), the source-only errors went from 11 (main) to 22 (adjustments-190126). While numerically higher, the dist/ bundle is no longer linted on adjustments-190126, which is an improvement in lint configuration.
- **API tests:** 14 new tests added (pricing.service.test.ts, cron-guard.test.ts, routes-prefixes.test.ts) - all passing. Main has zero test files. This is a significant improvement.
- **Structured logging:** API on adjustments-190126 outputs structured JSON logs (with event, requestId, service fields) vs simple "Elysia is running" on main.
- **Web build:** Both pass, but adjustments-190126 processes 2445 modules (vs 737 on main), indicating significantly more code. Build still succeeds.

---

## Notes

- **Prisma engine:** No engine mismatch issues encountered. Both branches generate the Prisma client successfully with v6.19.1.
- **Codespaces/Linux:** No `binaryTargets` issues encountered in this environment.
- **Package count:** adjustments-190126 installs 605 packages vs main's 1046. The workspace structure was reorganized.
- **Scope of change:** 144 files changed, 8512 insertions, 1342 deletions. This is a large changeset covering API restructuring (new routes, services, middleware), web component rewrites (Zustand store, basket, filters, comparison), new test infrastructure, and schema migrations.
- **Root cause of typecheck regression:** The adjustments-190126 branch rewrote the Zustand store and many components but introduced type mismatches (especially `useStore` returning `unknown` due to `shallow` call signature changes and missing type annotations). The `setResults` and `enabledStores` identifiers are referenced but not defined in the new store.

---

## Summary

The `adjustments-190126` branch introduces a large-scale refactoring with clear improvements (structured logging, test coverage, cleaner lint config). However, it has a **critical typecheck regression** with 72 new TypeScript errors (vs 0 on main) concentrated in the web app's Zustand store integration and component type safety. The web build still succeeds (Vite does not enforce strict types), so the app would run, but type safety is degraded. The API also gained 6 new typecheck errors and 13 new lint errors from newly added files.
