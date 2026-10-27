# 1. Record architecture decisions

Status: accepted

## Context

Choices such as the web framework or the identity model outlive the people who made them. Without a record, later contributors either repeat the debate or undo the choice by accident. Chat threads and pull request comments are hard to find and do not stay with the code.

## Decision

We record each irreversible technical decision as an Architecture Decision Record in `docs/decisions/`. Each file is named `NNNN-<slug>.md`, uses the Context, Decision, Consequences layout, and runs 20 to 40 lines. We never edit an accepted ADR. To change a decision, we write a new ADR that states `Supersedes: NNNN`.

## Consequences

- A new top-level or `src/` directory comes with an ADR, which keeps the layout deliberate.
- The history of why the code looks the way it does lives in git next to the code.
- Writing an ADR adds a few minutes to decisions that are hard to reverse. We skip ADRs for reversible choices.
