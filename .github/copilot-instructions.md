# SuperMarket-APP Copilot Instructions

## Project context
- Bun monorepo
- React + Vite frontend in `apps/web`
- Elysia API in `apps/api`
- Prisma schema in `packages/db/prisma/schema.prisma`

## General conventions
- Prefer minimal diffs and reuse existing patterns.
- Do not add dependencies unless necessary.
- Keep TypeScript strict.
- Avoid hidden Unicode characters.
- Do not use the em dash character in generated text.

## Build and test
- Install: `bun install`
- Prisma generate: `bunx prisma generate --schema packages/db/prisma/schema.prisma`
- Web: `bun run --cwd apps/web lint`, `bun run --cwd apps/web typecheck`, `bun run --cwd apps/web build`
- API: `bun run --cwd apps/api lint`, `bun run --cwd apps/api typecheck`
