# SuperMarket-APP Agent Guide

## Scope
Monorepo with:
- apps/web
- apps/api
- packages/db
- packages/shared

## Working rules
- Prefer small, isolated changes.
- Search for existing helpers, components, routes, and DTOs before creating new ones.
- Do not fix unrelated lint or typecheck noise.
- Keep runtime behavior unchanged unless the task explicitly requires behavior changes.
- Avoid `any` and unsafe casts.

## Validation
- Install: `bun install`
- Prisma generate: `bunx prisma generate --schema packages/db/prisma/schema.prisma`
- Web validation:
  - `bun run --cwd apps/web lint`
  - `bun run --cwd apps/web typecheck`
  - `bun run --cwd apps/web build`
- API validation:
  - `bun run --cwd apps/api lint`
  - `bun run --cwd apps/api typecheck`

## Change discipline
- For risky changes, state assumptions and plan first.
- Keep diffs reviewable.
- Add concise rollback notes when touching shared contracts, routing, or schema.
