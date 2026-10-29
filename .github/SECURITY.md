# Security policy

## Report a vulnerability

Use GitHub private vulnerability reporting: <https://github.com/tanzhongyan-org/template-ts-backend/security/advisories/new>. Do not open a public issue.

TEMPLATE-TODO(security): replace the reporting link with your repository's advisory URL, or add a security contact address.

## What we support

Only the `main` branch receives security fixes.

## What to expect

| Step | Target |
| --- | --- |
| Acknowledge your report | 3 business days |
| Triage and first assessment | 10 business days |

## How this repository is scanned

| Layer | Tool | When |
| --- | --- | --- |
| Static analysis | Biome recommended rules, ast-grep rules | `make lint`, `make slop` |
| Static analysis, cross-language | CodeQL with `security-extended` queries, JavaScript/TypeScript and GitHub Actions | Push, pull request, weekly |
| Secrets | gitleaks over full history (`make security`); staged scan in the pre-commit hook | CI, commit |
| Dependencies | `bun audit`; dependency review on pull requests | CI |
| Supply chain | osv-scanner and the new-dependency check: a new dependency must exist on the registry, be at least 14 days old and have a ledger row (`make security`) | CI |
| Licences | `make licenses` fails banned and unknown licences and rewrites `NOTICE` | CI |
| Workflows | zizmor | CI |
| Dynamic testing | Schemathesis against the OpenAPI document | Weekly, manual |
