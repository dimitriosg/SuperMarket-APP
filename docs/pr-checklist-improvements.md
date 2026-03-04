# PR Checklist: 10 High-Impact Improvements

Scope: API + Web + shared repo hygiene, focused on **types**, **error handling**, **folder structure**, and **API consistency**.

## Types
- [ ] **Remove `any` from product mapping in API search route** (`apps/api/src/routes/products.route.ts`). Introduce explicit DTO types for `ProductWithPrices` and `ProductSearchResponse`.
- [ ] **Type `compareBasket` input and response on Web API client** (`apps/web/src/services/api.ts`). Replace `items: any[]` and loosely parsed responses with shared interfaces from `packages/shared`.
- [ ] **Replace legacy helper naming with typed utility contract** (`getStoreIdByName_OLD` in `apps/web/src/services/api.ts`). Remove deprecated helper and expose one typed function.

## Error Handling
- [ ] **Standardize API error payload shape across routes**. Some routes return `{ error: "Internal Error" }`, others return `{ error, message }` or array fallbacks. Define one `ApiError` schema and apply it in all handlers.
- [ ] **Replace `console.error`/`console.log` with structured logger in routes/services** (`apps/api/src/routes/search.route.ts`, `apps/api/src/routes/products.route.ts`). Include `requestId` and route context.
- [ ] **Fail-safe cron execution with guarded error logging** (`apps/api/src/index.ts`). Wrap `ekatanalotisService.syncAll()` in retry/backoff or error boundary so background failures are observable and do not silently cascade.

## Folder Structure
- [ ] **Consolidate duplicated AI suggestion modules** (`apps/api/src/ai/*` and `apps/api/src/services/ai-suggestions.service.ts`). Keep one source of truth (service + controller pattern), remove dead or overlapping copies.
- [ ] **Split oversized client constants from API logic** (`apps/web/src/services/api.ts`). Move location/store metadata to `src/constants/` and keep this file focused on HTTP client functions.

## API Consistency
- [ ] **Resolve duplicated route ownership for `/products/search`** (`apps/api/src/routes/products.route.ts` and `apps/api/src/routes/search.route.ts`). Keep one canonical endpoint implementation.
- [ ] **Normalize route prefixes and versioning strategy**. `auth` is under `/api/auth` while other feature routes use bare prefixes like `/products`; adopt a consistent base (e.g. `/api/v1/...`) across all modules.

---

## Suggested rollout order
1. Route/API consistency cleanup (single ownership + consistent prefixes).
2. Shared types/contracts (`packages/shared`) for request/response DTOs.
3. Error schema unification + structured logging migration.
4. Folder refactor to remove duplication and improve discoverability.
