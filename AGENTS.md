# TypeScript Backend Agent Guidelines (L0)

## 1. Universal Architectural Invariants
- **Domain Colocation over Technical Grab-Bags:** Organize code strictly by cohesive domain boundaries (`src/domain/<feature>/`). Never create generic `utils/`, `helpers/`, or `misc/` directories.
- **Unidirectional Layering:**
  `Transport (HTTP routes in src/api) -> Domain Services -> Persistence (Repositories) / Infrastructure`
  Transport handlers parse/validate inputs and delegate immediately; they never execute business rules or raw database queries.
- **Boundary Schema Validation:** Direct access to `process.env` in domain logic is strictly banned. Validate all environment variables inside `src/core/config.ts` using strict Zod schemas.
- **Search-Before-Author:** Search existing modules before authoring helpers. Parameterize existing code; fork-and-duplicate is strictly prohibited.

## 2. Directory Layout
```
src/
├── api/                         # Transport: HTTP route handlers & middleware (thin)
│   └── routes/
├── domain/                      # Cohesive Domain Boundaries (Colocated)
│   └── <feature>/
│       ├── schemas.ts           # Zod request/response validation schemas
│       ├── service.ts           # Pure business logic & transactions
│       └── repository.ts        # Data persistence layer
├── core/                        # Infrastructure & Cross-cutting primitives
│   └── config.ts                # Validated Zod environment configuration
└── index.ts                     # Application entry point & server bootstrap
```

## 3. The 6 Verification Gates
Before claiming task completion or creating PRs, all gates must pass:
1. **Typecheck:** `npm run typecheck` (0 errors)
2. **Lint & Format:** `npx @biomejs/biome check .` (0 warnings)
3. **Tests:** `npm test` (Full suite green)
4. **Dead Code:** Zero unused exports
5. **Duplication Audit:** `npx --yes fallow@3.33.1 dupes --quiet --no-fragments`
6. **Anti-Slop Scan:** `npx --yes --package @ast-grep/cli ast-grep scan`
