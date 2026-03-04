# apps/api AGENTS.md

API specific rules
- Do not introduce new route files unless necessary.
- If there are duplicate routes, pick one canonical implementation and keep the other as an alias.
- Use a structured logger, do not use console.log or console.error.
- Ensure background jobs are guarded so failures are visible and do not crash the process.
