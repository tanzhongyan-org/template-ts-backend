BIN := node_modules/.bin
BASE_URL ?= http://localhost:3000
# Offline by default; CI passes ZIZMOR_ARGS= with GH_TOKEN set to enable the online audits.
ZIZMOR_ARGS ?= --offline

# renovate: datasource=pypi depName=zizmor
ZIZMOR_VERSION := 1.31.1
# renovate: datasource=pypi depName=schemathesis
SCHEMATHESIS_VERSION := 4.32.7
# renovate: datasource=github-releases depName=gitleaks/gitleaks extractVersion=^v(?<version>.*)$
GITLEAKS_VERSION := 8.30.1
# renovate: datasource=github-releases depName=google/osv-scanner extractVersion=^v(?<version>.*)$
OSV_SCANNER_VERSION := 2.7.0

.PHONY: setup up down dev dev-node build db-push test lint fix fmt typecheck deadcode dupes slop policy verify check audit workflows dast template-debt licenses security openapi spec-diff

setup:
	bun install --frozen-lockfile
	$(BIN)/lefthook install

up:
	docker compose up -d --wait

down:
	docker compose down

dev:
	bun --watch src/index.ts

dev-node:
	$(BIN)/tsx watch src/node.ts

build:
	$(BIN)/tsc -p tsconfig.build.json

db-push:
	$(BIN)/drizzle-kit push

test:
	$(BIN)/vitest run

typecheck:
	$(BIN)/tsc --noEmit

lint:
	$(BIN)/biome check .
	$(BIN)/markdownlint-cli2

fix:
	$(BIN)/biome check --write .
	$(BIN)/markdownlint-cli2 --fix

# Formats one file; the agent post-edit hook calls this with FILE set.
fmt:
	$(BIN)/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true $(FILE)

deadcode:
	$(BIN)/knip

dupes:
	$(BIN)/fallow dupes --quiet --no-fragments

slop:
	$(BIN)/ast-grep scan
	$(BIN)/ast-grep test --skip-snapshot-tests

policy:
	node scripts/repo-policy.mjs all

# Fast gates, no database. Used by git hooks and the agent stop hook.
verify: typecheck lint slop policy

# Full gate set. CI runs this.
check: verify test deadcode dupes spec-diff

audit:
	bun audit

licenses:
	node scripts/licenses.mjs

security:
	GITLEAKS_VERSION=$(GITLEAKS_VERSION) OSV_SCANNER_VERSION=$(OSV_SCANNER_VERSION) node scripts/security.mjs

openapi:
	bun scripts/openapi.mjs

spec-diff:
	bun scripts/openapi.mjs --check

workflows:
	uvx zizmor@$(ZIZMOR_VERSION) $(ZIZMOR_ARGS) --min-severity medium .github/workflows

# Runs Schemathesis against a server already listening on BASE_URL.
dast:
	uvx schemathesis@$(SCHEMATHESIS_VERSION) run $(BASE_URL)/doc --url $(BASE_URL) \
		--header "x-user-id: dast" --checks all --workers 1

template-debt:
	@git grep -n "TEMPLATE-TODO[(]" || true
