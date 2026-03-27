# CLAUDE.md

## Workflow Rules

- **Every issue or feature MUST have a GitHub issue before any work begins.**
- **Every change MUST go through a Pull Request (PR) — no direct commits to `main`.**
- The `main` branch is protected: PRs require at least 1 approving review.

## Labels

- **Every issue and every PR MUST have at least one label assigned.**
- Available labels: `bug`, `duplicate`, `enhancement`, `feature`, `refactor`

## Attribution

- **Never add Claude/AI as co-author, contributor, or any form of attribution in commits, PRs, or code.**

## Branch Naming

All branches must follow this convention:

```
feature/<issue-number>_PascalCaseName
```

Examples:
- `feature/12_AddUserAuthentication`
- `feature/5_FixDatabaseMigration`
- `feature/27_RefactorOrderService`
