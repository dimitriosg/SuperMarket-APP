---
applyTo: "apps/web/**/*.{ts,tsx}"
---

- Prefer isolated components and hooks over large rewrites.
- Reuse existing UI and state-management patterns before creating new ones.
- New UI must handle loading, empty, error, and success states.
- New interactive UI must be keyboard-friendly and accessible.
- localStorage keys must be defined in constants, not inline strings.
- Avoid unnecessary styling churn.
- No em dash character in UI copy.
