# TypeScript Backend Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Node.js 20+ with strict TypeScript ESM
- Framework: Hono with @hono/zod-openapi and @hono/node-server
- Documentation: Interactive Scalar API at `/reference`, OpenAPI spec at `/doc`
- Validation: Zod schemas via `createRoute` from `@hono/zod-openapi`
- Code Quality: Biome (sub-100ms format & lint), Vitest, TypeScript strict mode
- Task Runner: Universal Makefile (`install`, `dev`, `test`, `lint`, `lint-fix`, `check`)

## 2. Physical File Placement Rules
- Transport Handlers: Thin route controllers in `src/api/routes/<feature>.ts`
- Domain Boundaries: Business logic and schemas in `src/domain/<feature>/`
- Configuration: Centralized environment schema in `src/core/config.ts`
- App Architecture: Wire routes & middleware in `src/app.ts`; server lifecycle in `src/index.ts`
- Test Suites: Sister-file colocated tests (`src/api/routes/<feature>.test.ts`)

## 3. Boundary & Routing Invariants
- Direct access to `process.env` is strictly banned outside `src/core/config.ts`.
- Contract-First Routing: Always define routes with `createRoute` specifying request/response schemas.
- In tests, use in-memory `app.request()` rather than spinning up live network ports.

## 4. Verification Gates
Run `make check` or individual commands:
1. Gate 1 (Typecheck): `npm run typecheck`
2. Gate 2 (Lint & Format): `npm run lint`
3. Gate 3 (Tests): `npm test`
4. Gate 4 (Dead Code): `npm run build`
5. Gate 5 (Duplication): `npx --yes fallow@3.33.1 dupes --quiet --no-fragments`
6. Gate 6 (Anti-Slop): `npx --yes --package @ast-grep/cli ast-grep scan`
