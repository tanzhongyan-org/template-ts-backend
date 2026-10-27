.PHONY: setup dev dev-node test lint fix typecheck check up down build

setup:
	bun install --frozen-lockfile

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

check:
	bun run typecheck
	bun run lint
	bun run test
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli ast-grep scan
