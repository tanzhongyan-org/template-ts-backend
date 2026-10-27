# Docs

Documents are sorted by how long they stay true.

| Where | What goes there | Lifespan |
| --- | --- | --- |
| `ARCHITECTURE.md` (repo root) | Current structure, code map and invariants. Update it in the same PR as the code. | Permanent |
| `docs/decisions/` | One ADR per irreversible choice, numbered `NNNN-<slug>.md`, 20 to 40 lines. Never edit an ADR; write a new one that supersedes it. | Permanent |
| **specs** | A functional spec for a feature in progress: rules, edge cases, acceptance scenarios. | Until the feature ships |
| **plans** | A task checklist for one PR. Commit it, then remove it with `git rm` when the PR merges. | One PR |
| **archive** | Specs and lessons you want to keep but not load by default. | Permanent |
| `docs/dependencies.md` | The ledger: one row per dependency. `make policy` fails when a row is missing. | Permanent |

Create the specs, plans and archive folders under docs when you first need them. When a spec ships, move its rules into `ARCHITECTURE.md` and its edge cases into tests.
