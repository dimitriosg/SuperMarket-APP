# Codex Plan

## Milestones
1. Add shared DTO contracts in `packages/shared/src/dtos.ts` and export them from `packages/shared/src/index.ts`.
2. Apply DTO typing in API product search route with Prisma typed payload and remove `any` usage.
3. Apply DTO typing in Web API client and Web domain types to align with API contracts.
4. Verify required scripts and address any typing or linting fallout.

## Acceptance criteria
- Shared DTOs exist for product search and basket analyze request and response contracts.
- API `/products/search` keeps the same JSON keys and behavior while returning typed `ProductSearchResponseDto`.
- Web `compareBasket` no longer accepts `any[]` and returns typed basket store results parsed from basket analyze response shape.
- `Offer.price` in web types is numeric and affected call sites compile.
- Required verification commands pass.

## Rollback plan
1. Revert `packages/shared/src/dtos.ts` and DTO exports from `packages/shared/src/index.ts`.
2. Revert API route typing changes in `apps/api/src/routes/products.route.ts`.
3. Revert Web typing changes in `apps/web/src/services/api.ts` and `apps/web/src/types/index.ts`.
4. Re-run verification scripts to confirm repository returns to prior baseline.

## Notes for this task
- Keep runtime behavior unchanged.
- Keep route payload keys backward compatible.
- Keep this change focused on types and contracts only.
