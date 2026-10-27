# 2. Use Hono, Zod, Drizzle and Postgres on Bun

Status: accepted

## Context

This template starts REST backends that need a typed contract, a relational database and quick local feedback. We want one source of truth for request shapes, the OpenAPI document and TypeScript types. We also want the service to run on Node.js when Bun is not available.

## Decision

- Hono handles routing. It runs on Bun and Node.js through standard `fetch` handlers.
- `@hono/zod-openapi` defines each route once with Zod schemas. Validation and the OpenAPI document both come from that definition.
- Drizzle ORM with the `postgres` driver provides typed queries on Postgres.
- Bun is the default runtime and package manager. `src/node.ts` keeps Node.js 22 working.
- Biome formats and lints, Vitest tests, and the Makefile is the single command entry point.

## Consequences

- Handlers stay thin, and the contract cannot drift from the implementation.
- Zod and Drizzle schemas are separate; a column change touches both.
- The OpenAPI document is version 3.0, the version `@hono/zod-openapi` emits by default.
- Two entry points exist and each sets its own server timeouts.
