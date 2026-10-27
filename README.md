# TypeScript Backend API Template

Universal TypeScript backend application template with agentic quality guardrails and verification gates.

## Features

- **Runtime:** Node.js 20+ with strict TypeScript ESM
- **Framework:** [Hono](https://hono.dev/) with domain-colocated architecture
- **Config & Validation:** Zod environment validation & route schemas
- **Code Quality:** [Biome](https://biomejs.dev/) (sub-100ms format & lint), Vitest, TypeScript strict mode
- **Agent Guardrails:**
  - `lefthook.yml`: Sub-second local Git pre-commit hooks
  - `fallow.jsonc`: AST-aware code duplication and cognitive complexity limits
  - `sgconfig.yml` + `.ast-grep/`: Automatic detection of placeholder stubs and unfulfilled code
  - `.github/workflows/ci.yml`: Automated CI running the 6 Universal Verification Gates
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
npm install

# Start development server
npm run dev
```

### 3. Run Verification Gates
```bash
# Gate 1: Typecheck
npm run typecheck

# Gate 2: Lint & Format
npm run lint

# Gate 3: Test
npm test

# Gate 5: Duplication Audit
npx --yes fallow@3.33.1 dupes --quiet --no-fragments

# Gate 6: Anti-Slop Scan
npx --yes --package @ast-grep/cli ast-grep scan
```
