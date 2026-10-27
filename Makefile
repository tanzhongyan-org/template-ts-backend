.PHONY: install dev test lint lint-fix check

install:
	npm install

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

lint-fix:
	npm run lint:fix

check:
	npm run typecheck
	npm run lint
	npm test
	npx --yes fallow@3.33.1 dupes --quiet --no-fragments
	npx --yes --package @ast-grep/cli ast-grep scan
