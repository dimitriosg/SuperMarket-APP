# Codex Plan

## Milestones
1. Audit current OpenAI SDK usage and package scripts.
2. Update API dependency from `@openai/sdk` to `openai` and migrate imports and error classification logic.
3. Add a direct `typecheck` script in `packages/shared`.
4. Refresh dependencies with `bun install` and validate required checks.
5. Commit and prepare PR description.

## Acceptance Criteria
- `apps/api/package.json` no longer lists `@openai/sdk` and includes `openai` at a stable version.
- All repository imports referencing `@openai/sdk` are replaced with `openai` compatible usage.
- `apps/api/src/services/ai-suggestions.service.ts` keeps existing error payload shape and codes while using `OpenAI.APIError` and error name checks.
- `packages/shared/package.json` includes `scripts.typecheck` set to `bunx tsc -p tsconfig.json --noEmit`.
- Lockfile updates from `bun install` are committed.
- Verification commands complete:
  - `bun install`
  - `bun run lint`
  - `bun run typecheck`
  - `bun run --cwd packages/shared typecheck`
  - `bun run --cwd apps/web build`

## Rollback Plan
1. Revert commit(s) that change dependency and script configuration.
2. Restore `apps/api/src/services/ai-suggestions.service.ts` error handling import and checks from git history.
3. Re-run `bun install` to restore previous lockfile if needed.
4. Re-run baseline verification to confirm rollback integrity.
