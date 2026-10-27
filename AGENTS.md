# TypeScript Backend Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Node.js 20+ with strict TypeScript ESM
- Framework: Hono (@hono/node-server) with @hono/zod-openapi
- Documentation: Interactive Scalar API documentation (@scalar/hono-api-reference) at /reference and OpenAPI v3 JSON spec at /doc
- Validation: Zod schemas for input parsing and route contracts via createRoute
- Lint & Format: Biome (sub-100ms)
- Test Runner: Vitest
- Task Runner: Universal Makefile

## 2. Physical File Placement Rules
- Transport Handlers: Place thin route controllers and OpenAPI route definitions in src/api/routes/<feature>.ts
- Domain Boundaries: Place business logic and OpenAPI/Zod schemas in src/domain/<feature>/
- Configuration: Validated environment variables in src/core/config.ts
- Test Suites: Sister-file colocated tests (e.g. src/api/routes/<feature>.test.ts)

## 3. Data Access & Boundary Invariants
- Direct access to process.env in domain logic is strictly banned. Import config from the core configuration module (e.g. "./core/config.js" or "../core/config.js").
- Contract-First Routing: Define typed route definitions using createRoute from @hono/zod-openapi with request/response schemas.
- Expose OpenAPI JSON spec at /doc and interactive documentation at /reference.
- Domain functions return typed schemas, avoiding raw database leaks.

## 4. The 6 Verification Gates
Run these commands to prove task completion:
1. Gate 1 (Typecheck): npm run typecheck
2. Gate 2 (Lint & Format): npm run lint (or npx @biomejs/biome check .)
3. Gate 3 (Tests): npm test
4. Gate 4 (Dead Code): Zero unused exports
5. Gate 5 (Duplication): npx --yes fallow@3.33.1 dupes --quiet --no-fragments
6. Gate 6 (Anti-Slop): npx --yes --package @ast-grep/cli ast-grep scan
