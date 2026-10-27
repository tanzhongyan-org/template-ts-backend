# Lessons

Load this file only when a gate fails or a task matches a pain point below.

## Pain-point rules

| # | Rule | Owner | Detection |
|---|---|---|---|
| 1 | Never fall back to a default owner when identity is missing; return 401. | `src/api/middleware/identity.ts` | `src/api/routes/notes.security.test.ts` |
| 2 | Write every error response with `respondError` so the envelope stays identical. | `src/api/errors.ts` | Entry-point tests assert the envelope |
| 3 | Add a dependency only with a row in `docs/dependencies.md`. | `docs/dependencies.md` | `make policy` |
| 4 | Declare tool versions once, in `package.json` or a `# renovate:` annotated Makefile variable. | `package.json`, `Makefile` | `renovate.json`, `make policy` |

## Incident log

| Date | Task | Mistake | Fix | Detection |
|---|---|---|---|---|
