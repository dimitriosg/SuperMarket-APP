# AGENTS.md

You are working in a monorepo:
- apps/api
- apps/web
- packages/shared

Operating rules
1) Plan first for any task that changes more than 3 files or touches both API and Web.
   - Create docs/codex-plan.md with milestones, acceptance criteria, and a rollback plan.
2) Search the repo before adding new helpers or new endpoints. Prefer reuse over duplication.
3) Keep type safety. Avoid any, avoid unsafe casts. Prefer proper DTOs and runtime guards.
4) Backward compatibility first. If changing routes or payloads, keep adapters or aliases.
5) No em dash character in any text you write in commits, PR descriptions, or docs.

Verification
- Discover the correct scripts in package.json and run the closest equivalents of:
  - lint
  - typecheck
  - test
  - build
- Run verification after every milestone and fix failures before continuing.
- If verification is slow, run the smallest relevant subset first, then full suite at the end.

API conventions
- Standardize error responses using a single ApiError shape:
  { "error": { "code": string, "message": string, "requestId": string, "details"?: unknown } }
- Include requestId in logs and error payloads where possible.
- Prefer consistent route prefixes across modules. If introducing versioning, keep old paths working.

Web conventions
- Keep api client functions focused on HTTP. Move constants to src/constants.
- Prefer small, reviewable UI changes. Add new components instead of rewriting large files.
- Always handle empty states and loading states for new UX flows.

Deliverables for each task
- A concise PR description with:
  - what changed
  - how to test locally
  - risk notes and rollback notes
