# template-ts-backend

A TypeScript backend starter for teams that want a typed REST API with an OpenAPI contract, a Postgres database and automated quality gates from the first commit.

[![CI](https://github.com/tanzhongyan-org/template-ts-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/tanzhongyan-org/template-ts-backend/actions/workflows/ci.yml)
[![CodeQL](https://github.com/tanzhongyan-org/template-ts-backend/actions/workflows/codeql.yml/badge.svg)](https://github.com/tanzhongyan-org/template-ts-backend/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick start

You need:

- Bun and Node.js 22 or newer.
- Docker, for the local Postgres.
- GNU make. On Windows run `winget install ezwinports.make`; on macOS run `xcode-select --install`. Restart your terminal and agent afterwards.

If port 5432 is taken, set `POSTGRES_PORT` in `.env` and update the port in `DATABASE_URL`. To skip the agent stop hook for one session, set `AGENT_HOOK_SKIP=1`.

[CONTRIBUTING.md](.github/CONTRIBUTING.md) lists where each version is pinned.

```bash
gh repo create my-backend --template tanzhongyan-org/template-ts-backend --private --clone
cd my-backend
make setup && cp .env.example .env
make up && make db-push
make dev
```

You should see `[Bun] Server listening on http://localhost:3000`. In another terminal:

```bash
curl -s -H "x-user-id: alice" localhost:3000/notes
```

You should see `[]`. Open `http://localhost:3000/reference` for the interactive API reference.

## What you get

- Hono routes defined with `createRoute`, so request and response schemas produce the OpenAPI document at `/doc`.
- Zod 4 validation and a typed, validated config module.
- Drizzle ORM on Postgres, with a notes example slice that scopes every query to its owner.
- One error envelope for every failure: `{"error": {"message": "...", "status": 404}}`.
- Fail-closed identity: requests without a trusted `x-user-id` header get a 401. Set `JWKS_URL` to validate product JWTs instead.
- A request body size limit and server timeouts.
- Six verification gates behind `make check`, plus git hooks, CI, CodeQL, secret scanning and scheduled API fuzzing.

## After creating your repo

1. Run the **Initialize Template Repository** workflow from the Actions tab. It renames the placeholders and opens a "Template follow-ups" issue.
2. List what you still have to change:

   ```bash
   make template-debt
   ```

   You should see one line per `TEMPLATE-TODO(...)` marker, covering auth, owners, the security contact, the license holder and the example notes slice.

## Configuration

Copy `.env.example` to `.env`. Bun loads it on start.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | One of `development`, `test`, `production`. |
| `PORT` | No | `3000` | HTTP port. |
| `APP_NAME` | No | `template-ts-backend` | Title in the OpenAPI document. |
| `APP_VERSION` | No | `0.1.0` | Version in the OpenAPI document and `/health`. |
| `DATABASE_URL` | No | local Postgres URL | Postgres connection string. |
| `POSTGRES_PORT` | No | `5432` | Host port Docker Compose publishes Postgres on. Change it when 5432 is taken. |
| `TRUST_IDENTITY_HEADER` | No | `false` | When `true`, the `x-user-id` header identifies the caller. When `false`, `/notes` returns 401 for every request. |
| `MAX_BODY_BYTES` | No | `1048576` | Largest accepted request body. Larger bodies get a 413. |
| `JWKS_URL` | No | — | JWKS endpoint of the product's auth server. When set, protected routes validate Bearer JWTs instead of trusting the header. |
| `JWT_ISSUER` | No | — | Expected `iss` claim. Checked only when set. |
| `JWT_AUDIENCE` | No | — | Expected `aud` claim. Checked only when set. |

> [!WARNING]
> `TRUST_IDENTITY_HEADER=true` lets any client choose its identity. Use it for local work and tests only, and replace it with real authentication before you deploy. The server refuses to boot in production while it is set.

## Commands

| Command | What it does |
| --- | --- |
| `make setup` | Installs dependencies and git hooks. |
| `make up` / `make down` | Starts or stops Postgres with Docker Compose. |
| `make db-push` | Applies the Drizzle schema to the database in `DATABASE_URL`. |
| `make dev` | Runs the server on Bun with reload. |
| `make dev-node` | Runs the server on Node.js with reload. |
| `make build` | Compiles to `dist/` for the Node.js entry point. |
| `make test` | Runs Vitest. Needs the database. |
| `make lint` / `make fix` | Checks or fixes formatting and lint rules for code and Markdown. |
| `make typecheck` | Runs the TypeScript compiler without emitting. |
| `make deadcode` | Finds unused files and dependencies with knip. |
| `make dupes` | Finds duplicated code with fallow. |
| `make slop` | Runs the ast-grep anti-slop and boundary rules and their tests. |
| `make policy` | Checks layout, docs, the dependency ledger and version drift. |
| `make verify` | Runs the fast gates: typecheck, lint, slop, policy. No database. |
| `make check` | Runs `make verify`, then tests, dead code and duplication. CI runs this. |
| `make audit` | Checks dependencies for known vulnerabilities. |
| `make workflows` | Lints GitHub workflows with zizmor. Needs `uv`. |
| `make dast` | Fuzzes a running server with Schemathesis. Needs `uv`. |
| `make template-debt` | Lists `TEMPLATE-TODO` markers. |

## Project layout

| Path | Purpose |
| --- | --- |
| `src/` | Application code. See [ARCHITECTURE.md](ARCHITECTURE.md). |
| `drizzle/` | Generated SQL migrations. |
| `docs/` | Decisions, specs and the dependency ledger. See [docs/README.md](docs/README.md). |
| `scripts/` | Policy checker and agent hook. |
| `.github/` | Workflows, issue forms and the branch ruleset. |

More: [CONTRIBUTING.md](.github/CONTRIBUTING.md), [SECURITY.md](.github/SECURITY.md), [LICENSE](LICENSE).
