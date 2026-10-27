# TypeScript Backend API Template

Universal TypeScript backend application template with contract-first OpenAPI routing, interactive API docs, agentic quality guardrails, and verification gates.

## Features

- **Runtime:** Bun 1.4.3 native runtime (with Node.js 22 fallback)
- **Framework:** [Hono](https://hono.dev/) with [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) contract-first architecture
- **Interactive Documentation:** [Scalar](https://scalar.com/) API reference at `/reference` and OpenAPI 3.0 specification at `/doc`
- **Config & Validation:** Zod environment validation & typed route contracts via `createRoute`
- **Code Quality:** [Biome](https://biomejs.dev/) (sub-100ms format & lint), Vitest, TypeScript strict mode
- **Task Runner:** Universal `Makefile` (`setup`, `dev`, `test`, `lint`, `fix`, `typecheck`, `check`)
- **Agent Guardrails:**
  - `lefthook.yml`: Sub-second local Git pre-commit hooks
  - `fallow.jsonc`: AST-aware code duplication and cognitive complexity limits
  - `sgconfig.yml` + `.ast-grep/`: Automatic detection of placeholder stubs and unfulfilled code
  - `.github/workflows/ci.yml`: Automated CI running the 6 Universal Verification Gates via `make check`
  - `AGENTS.md`: Runtime-specific agent invariants

## Getting Started

### 1. Create a New Repository
Click **"Use this template"** on GitHub or use the GitHub CLI:
```bash
gh repo create my-backend --template tanzhongyan-org/template-ts-backend --private --clone
cd my-backend
```
*(On first push to `main`, GitHub Actions automatically renames all template placeholders to your new repository name and self-deletes the initialization workflow).*

### 2. Local Setup
```bash
# Install dependencies
make setup
# or: bun install --frozen-lockfile

# Start development server
make dev
# or: bun run dev
```

### 3. API Endpoints
- `GET /`: Service welcome message
- `GET /health`: Health check returning `{ status: "ok", timestamp: string, version: "0.1.0" }`
- `GET /doc`: OpenAPI 3.0 JSON specification
- `GET /reference`: Interactive Scalar documentation UI

### 4. Run Verification Gates
```bash
# Run all gates
make check
```
