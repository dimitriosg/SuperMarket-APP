---
applyTo: "apps/api/**/*.{ts,tsx}"
---

- Prefer explicit error handling and structured logging.
- Do not change unrelated files to fix existing lint or typecheck noise unless asked.
- When touching scheduled jobs or cron code: ensure no double execution and add basic tests where feasible.
