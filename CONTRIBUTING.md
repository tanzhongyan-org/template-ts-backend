# Contributing

## Prerequisites

| Tool | Version source | Install |
| --- | --- | --- |
| Bun | `packageManager` in `package.json` | <https://bun.sh/docs/installation> |
| Node.js | 22 or newer (used by scripts and the Node.js entry point) | <https://nodejs.org/en/download> |
| Docker | any recent release, for Postgres | <https://docs.docker.com/get-docker/> |
| uv | any recent release, only for `make workflows` and `make dast` | <https://docs.astral.sh/uv/getting-started/installation/> |
| gitleaks | optional; the pre-commit hook scans staged files when it is installed | <https://github.com/gitleaks/gitleaks#installing> |

Every other tool is a dev dependency in `package.json` and runs from `node_modules`.

## Set up

```bash
make setup
cp .env.example .env
make up && make db-push
```

You should see Bun install packages, lefthook install its hooks, and `[✓] Changes applied` from the schema push.

## Run the daily loop

```bash
make verify
```

You should see no output other than command echoes and `repo-policy all: ok`. It takes a few seconds and needs no database.

Before you push, run the full set:

```bash
make check
```

You should see the same, plus a Vitest summary with every test passed. CI runs this command.

## Add a feature

The notes slice is the pattern. Touch these files in order:

1. `src/domain/notes/schema.ts`: add the Drizzle table. Run `make db-push`.
2. `src/domain/notes/schemas.ts`: add the Zod request and response schemas.
3. `src/domain/notes/service.ts`: add queries. Filter every one by `ownerId`.
4. `src/api/routes/notes.ts`: declare the contract with `createRoute`, list `errorResponse(...)` entries for each error status, and write the thin handler.
5. `src/app.ts`: mount the router, and add `requireIdentity` for the new path.
6. `src/api/routes/notes.test.ts`: test through `app.request()` at the public route, including the 401 and cross-owner 404 cases.
7. `ARCHITECTURE.md` and `docs/dependencies.md`: update the code map and add a ledger row for any new dependency.

A new directory under `src/` needs an ADR in `docs/decisions/` and an entry in `repo-policy.json` `layout.allow`, in the same pull request.

## Write commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(notes): add pagination`. The `commit-msg` hook rejects other formats.
- Do not add AI `Co-Authored-By` trailers. The hook rejects them.
- Fill in the pull request template. Paste the output of `make check`.

## Find the right doc

`docs/README.md` explains where decisions, specs and plans go.

## Maintainer tasks

<details>
<summary>Import the branch ruleset</summary>

`.github/rulesets/main.json` is a ruleset export for `main`. It requires a pull request, requires the `ci-passed` check, blocks force pushes and deletion, and requires CodeQL results.

In the GitHub UI, open Settings, Rules, Rulesets, New ruleset, Import a ruleset, and choose the file. From a terminal:

```bash
gh api repos/<owner>/<repo>/rulesets --method POST --input .github/rulesets/main.json
```

Replace `<owner>/<repo>`. You should see a JSON response with an `id`.

</details>

<details>
<summary>Renovate and template follow-ups</summary>

`renovate.json` groups non-major updates, waits 3 days after a release, and reads `# renovate:` comments in the Makefile and workflows. Install the Renovate GitHub app to turn it on.

`make template-debt` lists every `TEMPLATE-TODO` marker. The licence holder in `LICENSE` is one of them.

TEMPLATE-TODO(license): set the copyright holder in `LICENSE` to your own name or organization.

</details>
