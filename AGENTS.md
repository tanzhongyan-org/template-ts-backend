# TypeScript Backend Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here. The layout and code map live in [ARCHITECTURE.md](ARCHITECTURE.md).
This is the only agent instruction file. Claude Code, Codex, Cursor, Copilot and Gemini read it. Do not add CLAUDE.md, GEMINI.md or other per-tool copies: Claude Code ignores this file once a CLAUDE.md exists. `make policy` rejects them.

## 1. Stack

- Runtime: Bun (version in `package.json` `packageManager`), with a Node.js 22 entry point in `src/node.ts`.
- Framework: Hono with `@hono/zod-openapi`; Scalar reference at `/reference`, OpenAPI document at `/doc`.
- Validation: Zod 4 schemas through `createRoute`.
- Quality: Biome, Vitest, TypeScript strict mode, markdownlint.
- Command authority: the Makefile. Hooks, CI and agents call `make` targets only.

## 2. Where things go

- The Code map in [ARCHITECTURE.md](ARCHITECTURE.md) lists every directory and the helper to reuse.
- Handlers in `src/api/routes/<feature>.ts`; business logic and schemas in `src/domain/<feature>/`.
- Nest new code freely inside existing top-level directories. A new top-level directory needs a `layout.allow` entry in `scripts/repo-policy.json`; record the reason in `docs/decisions/` if it changes the architecture.
- Tests sit beside the code they cover (`src/api/routes/notes.test.ts`).

## 3. Invariants

- `process.env` is read only in `src/core/config.ts` [enforced by ast-grep].
- Routes use `createRoute` with request and response schemas, including error statuses [review-only].
- Errors go through `respondError`; never hand-write an error body [enforced by tests].
- Caller identity comes from `requireIdentity`, or from `requireJwt` when `JWKS_URL` is set; there is no default owner [enforced by tests].
- Tests call `app.request()` in memory; they do not open network ports [enforced by test runner].
- Mark anything a derived repo must change with `TEMPLATE-TODO(<area>): <what>`.

## 4. Verification gates

Run `make check` before you claim a task is done. Run `make verify` for a fast pass.

1. Gate 1, typecheck: `make typecheck`
2. Gate 2, lint and format: `make lint`
3. Gate 3, tests: `make test` (Vitest, needs Postgres)
4. Gate 4, dead code: `make deadcode` (knip)
5. Gate 5, duplication: `make dupes` (fallow)
6. Gate 6, anti-slop: `make slop` (ast-grep scan and rule tests)

`make policy` also runs inside both commands. CI additionally runs `make licenses` and `make security`.
