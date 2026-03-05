# AGENTS.md

You are working in a monorepo:
- apps/api
- apps/web
- packages/shared

Working style
- Prefer many small PRs merged one by one over large, sweeping changes.
- Do not fix pre-existing lint or typecheck noise outside the files you are already touching.

Operating rules
1) Plan first for any task that changes more than 3 files or touches both API and Web.
   - Create docs/codex-plan.md with milestones, acceptance criteria, and a rollback plan.
2) Search the repo before adding new helpers or new endpoints. Prefer reuse over duplication.
3) Keep type safety. Avoid any, avoid unsafe casts. Prefer proper DTOs and runtime guards.
4) Backward compatibility first. If changing routes or payloads, keep adapters or aliases.
5) No em dash character in any text you write in commits, PR descriptions, or docs.
6) Avoid hidden Unicode characters (ZWJ, ZWNJ, BOM, etc.). Prefer plain ASCII unless Greek copy is required.

Verification
- Discover the correct scripts in package.json and run the closest equivalents of:
  - lint
  - typecheck
  - test
  - build
- Run verification after every milestone and fix failures before continuing.
- If verification is slow, run the smallest relevant subset first, then full suite at the end.
- Concrete Bun commands per package:
  - apps/web: `bun run --cwd apps/web lint`, `bun run --cwd apps/web typecheck`, `bun run --cwd apps/web build`
  - apps/api: `bun run --cwd apps/api dev`, `bun run --cwd apps/api lint`, `bun run --cwd apps/api typecheck`

Prisma
- Generate the client with the explicit schema path:
  `bunx prisma generate --schema packages/db/prisma/schema.prisma`
- Codespaces / Linux containers: if you hit a Prisma engine mismatch, add
  `binaryTargets = ["native", "debian-openssl-3.0.x"]` in the generator block of
  packages/db/prisma/schema.prisma, then regenerate.

API conventions
- Standardize error responses using a single ApiError shape:
  { "error": { "code": string, "message": string, "requestId": string, "details"?: unknown } }
- Include requestId in logs and error payloads where possible.
- Prefer consistent route prefixes across modules. If introducing versioning, keep old paths working.

Web conventions
- Keep api client functions focused on HTTP. Move constants to src/constants.
- localStorage keys should be constants (e.g. src/constants/storageKeys.ts), not inline strings.
- Prefer small, reviewable UI changes. Add new components instead of rewriting large files.
- Always handle empty states and loading states for new UX flows.

Deliverables for each task
- A concise PR description with:
  - what changed
  - how to test locally
  - risk notes and rollback notes
