# Dependency ledger

One row per direct dependency in `package.json`. `make policy` fails when a dependency has no row or a row has no dependency.

## Runtime

| Dependency | Purpose | Why the default was not enough | Replaced |
| --- | --- | --- | --- |
| `hono` | HTTP router and middleware | Bun and Node.js have no routing, middleware or body limit primitives | Hand-written `fetch` dispatch |
| `jose` | Verifies product JWTs against the JWKS | Key fetching, caching and claim checks need hand-building on raw `crypto` | Nothing |
| `@hono/zod-openapi` | `createRoute` contracts that validate requests and emit OpenAPI | A separate OpenAPI file drifts from the handlers | Hand-maintained OpenAPI YAML |
| `@hono/node-server` | Runs the Hono app on Node.js | Node.js does not speak the `fetch` handler interface | Nothing; Bun needs no adapter |
| `@scalar/hono-api-reference` | Interactive API reference page | Reading raw OpenAPI JSON is slow for new readers | Swagger UI |
| `zod` | Schemas for config, requests and responses | TypeScript types vanish at runtime | Ad-hoc checks |
| `drizzle-orm` | Typed Postgres queries | Raw SQL strings lose type safety | Raw `postgres` queries |
| `postgres` | Postgres driver | Drizzle needs a driver | `pg` |

## Development

| Dependency | Purpose | Why the default was not enough | Replaced |
| --- | --- | --- | --- |
| `typescript` | Typecheck gate | Runtimes strip types without checking them | Nothing |
| `@types/node` | Node.js types for `process` and the Node.js entry point | Needed by the compiler | Nothing |
| `vitest` | Test runner | `bun test` does not run on the Node.js fallback | Jest |
| `@biomejs/biome` | Format and lint | One tool instead of ESLint plus Prettier | ESLint, Prettier |
| `drizzle-kit` | Schema push and migration generation | Drizzle ORM does not apply schemas | Hand-written SQL |
| `tsx` | Runs TypeScript on Node.js in watch mode | Node.js 22 cannot run `.ts` files | `ts-node` |
| `knip` | Dead code gate | The compiler ignores unused files and dependencies | `ts-prune` |
| `fallow` | Duplication gate | No other gate finds clone families | `jscpd` |
| `@ast-grep/cli` | Anti-slop and boundary rules | Lint rules cannot express project-specific structure | Regex hooks |
| `lefthook` | Git hooks | Git has no shared hook manager | Husky |
| `markdownlint-cli2` | Markdown lint | Biome does not check Markdown style | Nothing |

## Overrides

`package.json` `overrides` pins transitive packages that `bun audit` flags. Remove an override when the parent package ships the fix.

| Package | Override | Reason | Review by |
| --- | --- | --- | --- |
| esbuild | `^0.28.2` | `drizzle-kit` pulls `esbuild` 0.18.20, which allows any website to read dev server responses (GHSA-67mh-4wv8-2f99) | 2027-01-31 |
| katex | `^0.18.2` | `markdownlint-cli2` pulls a `katex` with a prototype pollution bug (GHSA-238p-pmpm-9mq7) | 2027-01-31 |
