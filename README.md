# SuperMarket Price-Comparison Monorepo

Bun monorepo for a Greek supermarket price-comparison PWA. The backend is an [Elysia](https://elysiajs.com/) API, the frontend is React + Vite + Tailwind, and data lives in Postgres with Redis caching, both run locally via Docker Compose.

## Requirements

- Node 22 (see `.node-version`)
- Bun >= 1.1.17 (`curl -fsSL https://bun.sh/install | bash`)
- Docker (for Postgres and Redis)

## Quick start

```bash
bun install
bun run db:up          # start Postgres + Redis containers
bun run db:generate    # generate Prisma client
bun run db:migrate     # apply database migrations
bun run dev            # start API + Web concurrently
```

- Web: http://localhost:5173
- API: http://localhost:3001 (default; set `PORT` in `.env` to change)

> **Port note:** The Vite dev server proxies `/api` requests to `http://localhost:4000` (see `apps/web/vite.config.ts`). To use the proxy during development, start the API with `PORT=4000` in your `.env`.

## Repository layout

```
.
├── apps
│   ├── api              # Elysia API -- CORS, structured logging, cron price sync
│   └── web              # Vite + React + Tailwind PWA -- search, basket, comparison
├── packages
│   ├── db               # Prisma schema, migrations, and client
│   └── shared           # Shared TypeScript types and Zod env schema
├── tests
│   └── e2e              # Playwright end-to-end tests
├── docker-compose.yml   # Postgres 16 + Redis 7
├── playwright.config.ts
├── tsconfig.base.json   # Shared TS config
├── eslint.config.mjs    # Flat ESLint config
├── prettier.config.cjs
├── .env.example
└── README.md
```

## Environment setup

1. Copy `.env.example` to `.env` at the repo root.
2. Optionally copy `apps/api/.env.example` to `apps/api/.env` for API-specific overrides.

## Development workflows

### Run everything

Start both API and Web with a single command:

```bash
bun run dev
```

### API commands

```bash
bun run --cwd apps/api dev          # start with --watch
bun run --cwd apps/api lint
bun run --cwd apps/api typecheck
bun run --cwd apps/api format
```

### Web commands

```bash
bun run --cwd apps/web dev
bun run --cwd apps/web build
bun run --cwd apps/web lint
bun run --cwd apps/web typecheck
bun run --cwd apps/web format
```

### Shared package

```bash
bun run --cwd packages/shared typecheck
```

## Database and cache

Start Postgres + Redis:

```bash
bun run db:up
```

Generate the Prisma client (required after schema changes):

```bash
bun run db:generate
```

Run migrations:

```bash
bun run db:migrate
```

Open Prisma Studio:

```bash
bun run db:studio
```

The Prisma schema lives at `packages/db/prisma/schema.prisma`.

## Testing

### API unit tests

```bash
bun test --cwd apps/api
```

### End-to-end tests (Playwright)

```bash
bun run test:e2e
```

CI workflows (`.github/workflows/ci.yml` and `e2e.yml`) run linting, typechecking, building, and E2E tests automatically on pull requests.
