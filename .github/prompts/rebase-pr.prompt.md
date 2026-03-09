---
agent: "agent"
description: "Rebase a feature branch on top of the latest base branch and validate merge gates"
---

Rebase the current feature branch on top of `${input:baseBranch:Base branch}`.

Requirements:
- preserve runtime behavior
- do not refactor unrelated code
- run:
  - `bun install`
  - `bun run --cwd packages/shared typecheck`
  - `bun run --cwd apps/web build`

If conflicts appear, resolve them with the smallest possible change.
Summarize:
- what changed
- any conflicts resolved
- validation results
- safe push command
