.PHONY: setup dev dev-node test lint fix typecheck check up down build audit

setup:
	bun install --frozen-lockfile
	bunx lefthook@2.2.2 install

up:
	docker compose up -d --wait

down:
	docker compose down

dev:
	bun run dev

dev-node:
	bun run dev:node

build:
	bun run build

test:
	bun run test

lint:
	bun run lint

fix:
	bun run lint:fix

typecheck:
	bun run typecheck

audit:
	bun audit

check:
	bun run typecheck
	bun run lint
	bun run test
	bunx knip@6.43.0
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli@0.51.0 ast-grep scan
	npx --yes --package @ast-grep/cli@0.51.0 ast-grep test --skip-snapshot-tests
