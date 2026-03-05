# SuperMarket-APP Copilot Instructions

## Project context
- Monorepo
- Primary workflow: many small PRs merged one by one
- Main working branch: adjustments-190126

## Tech stack
- Bun
- TypeScript
- apps/web: Vite + React
- apps/api: Bun runtime
- packages/db: Prisma schema at packages/db/prisma/schema.prisma (PostgreSQL)

## Guardrails
- Prefer minimal, isolated changes with no new dependencies unless explicitly requested.
- Do not attempt to fix pre-existing lint or typecheck failures outside the touched scope.
- Avoid introducing hidden Unicode characters (ZWJ, ZWNJ, BOM). Prefer plain ASCII in code and UI text unless Greek copy is required.
- Do not use the em dash character anywhere in text output (use hyphen or punctuation instead).

## Commands to run (important)
- Install: `bun install`
- Prisma client generation (required for API startup):
  - `bunx prisma generate --schema packages/db/prisma/schema.prisma`
- Dev (runs api + web): `bun dev`

### Validation by area (avoid repo-root lint/typecheck recursion)
- Web:
  - `bun run --cwd apps/web lint`
  - `bun run --cwd apps/web typecheck`
  - `bun run --cwd apps/web build`
- API:
  - `bun run --cwd apps/api lint` (may have known pre-existing errors)
  - `bun run --cwd apps/api typecheck` (may have known pre-existing errors)

## Prisma specific notes
- Codespaces runtime may require OpenSSL 3.0 engine. Ensure generator binaryTargets include native and debian-openssl-3.0.x when needed.
- Prisma does not support optional list types like Float[]?. Use Float[] (optionally with @default([])) or change modeling.
