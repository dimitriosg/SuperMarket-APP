# SuperMarket Price-Comparison Monorepo

Monorepo scaffold for the Greek supermarket price-comparison PWA. It uses Bun workspaces with a Fastify API, React + Vite frontend, shared packages, and local Postgres/Redis via Docker.

## Prerequisites
- Node 22 (see `.node-version`)
- Bun >= 1.1.17 (`curl -fsSL https://bun.sh/install | bash`)
- Docker for Postgres/Redis

## Installation
```bash
bun install
```

## Development
Start both API (http://localhost:4000) and Web (http://localhost:5173):
```bash
bun run dev
```

### App-specific commands
API:
```bash
bun run --cwd apps/api dev
bun run --cwd apps/api lint
bun run --cwd apps/api typecheck
bun run --cwd apps/api format
```

Web:
```bash
bun run --cwd apps/web dev
bun run --cwd apps/web lint
bun run --cwd apps/web typecheck
bun run --cwd apps/web format
```

## Database and cache
Start Postgres + Redis:
```bash
bun run db:up
```

Run migrations (initial schema includes `IngestionRun`):
```bash
bun run db:migrate
```

Open Prisma Studio:
```bash
bun run db:studio
```

## Environment
Copy `.env.example` to `.env` at the repo root and override as needed. Per-app examples live in `apps/api/.env.example` and `apps/web/.env.example`.

## Project structure
```
.
├── apps
│   ├── api            # Fastify API with health endpoint, CORS, helmet, rate limiting
│   └── web            # Vite + React + Tailwind PWA shell with API check button
├── packages
│   ├── db             # Prisma schema and client
│   └── shared         # Shared types and Zod env schema
├── docker-compose.yml # Postgres + Redis
├── tsconfig.base.json # Shared TS config + path aliases
├── eslint.config.mjs  # Flat ESLint config
├── prettier.config.cjs
├── .env.example
└── README.md
```

## Acceptance checklist (implemented)
- Bun workspaces with Node 22 engines
- Dev command runs API + Web
- API `/health` with CORS, helmet, and rate limiting
- Vite frontend with Tailwind, mobile-first hero, and API check button (proxy or env-based URL)
- Prisma schema + scripts for migrations/studio; Docker Compose for Postgres/Redis
- Shared env schema and health response type
- Lint/format/typecheck scripts
