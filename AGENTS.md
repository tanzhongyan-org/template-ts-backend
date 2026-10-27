# TypeScript Backend Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Bun 1.4.3 native runtime (with Node.js 22 fallback via `src/node.ts`)
- Framework: Hono with @hono/zod-openapi and @scalar/hono-api-reference
- Documentation: Interactive Scalar API at `/reference`, OpenAPI spec at `/doc`
- Validation: Zod 4 schemas via `createRoute` from `@hono/zod-openapi`
- Code Quality: Biome (format & lint), Vitest, TypeScript strict mode
- Task Runner: Universal Makefile (`setup`, `dev`, `test`, `lint`, `fix`, `typecheck`, `check`)

## 2. Physical File Placement Rules
- Transport Handlers: Thin route controllers in `src/api/routes/<feature>.ts`
- Domain Boundaries: Business logic and schemas in `src/domain/<feature>/`
- Configuration: Centralized environment schema in `src/core/config.ts`
- App Architecture: Wire routes & middleware in `src/app.ts`; server lifecycle in `src/index.ts`
- Test Suites: Sister-file colocated tests (`src/api/routes/<feature>.test.ts`)

## 3. Boundary & Routing Invariants
- Direct access to `process.env` is strictly banned outside `src/core/config.ts` [review-only].
- Contract-First Routing: Always define routes with `createRoute` specifying request/response schemas [review-only].
- In tests, use in-memory `app.request()` rather than spinning up live network ports [enforced by test runner].

## 4. Verification Gates
Run `make check` to verify task completion:
1. Gate 1 (Typecheck): `bun run typecheck`
2. Gate 2 (Lint & Format): `bun run lint`
3. Gate 3 (Tests): `bun run test` (Vitest)
4. Gate 4 (Dead Code): `bun run build` (tsc strict build)
5. Gate 5 (Duplication): `npx --yes fallow@3.33.1 dupes --quiet --no-fragments`
6. Gate 6 (Anti-Slop): `npx --yes --package @ast-grep/cli ast-grep scan`
