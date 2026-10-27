# TypeScript Backend Agent Guidelines (L1 Extension)

Inherits: Universal L0 Invariants (workflow/AGENTS.md).
Do not repeat global workflow rules here.

## 1. Project Technology Stack
- Runtime: Node.js 20+ with strict TypeScript ESM
- Framework: Hono (@hono/node-server)
- Validation: Zod schemas for input parsing and route contracts
- Lint & Format: Biome (sub-100ms)
- Test Runner: Vitest

## 2. Physical File Placement Rules
- Transport Handlers: Place thin route controllers in src/api/routes/<feature>.ts
- Domain Boundaries: Place business logic and schemas in src/domain/<feature>/
- Configuration: Validated environment variables in src/core/config.ts
- Test Suites: Sister-file colocated tests (e.g. src/api/routes/<feature>.test.ts)

## 3. Data Access & Boundary Invariants
- Direct access to process.env in domain logic is strictly banned. Import config from the core configuration module (e.g. "./core/config.js" or "../core/config.js").
- Transport routes parse and validate request payloads via Zod before delegating to domain functions.
- Domain functions return typed schemas, avoiding raw database leaks.

## 4. The 6 Verification Gates
Run these commands to prove task completion:
1. Gate 1 (Typecheck): npm run typecheck
2. Gate 2 (Lint & Format): npm run lint (or npx @biomejs/biome check .)
3. Gate 3 (Tests): npm test
4. Gate 4 (Dead Code): Zero unused exports
5. Gate 5 (Duplication): npx --yes fallow@3.33.1 dupes --quiet --no-fragments
6. Gate 6 (Anti-Slop): npx --yes --package @ast-grep/cli ast-grep scan
