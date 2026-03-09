---
applyTo: "apps/api/**/*.{ts,tsx}"
---

- Prefer explicit error handling and structured logging.
- Do not use `console.log` or `console.error`; use the project logger.
- Reuse existing route patterns and DTOs before creating new ones.
- Keep request and response shapes backward compatible when feasible.
- For jobs or schedulers, prevent silent failure and double execution.
- Do not fix unrelated lint or typecheck noise outside touched files.
