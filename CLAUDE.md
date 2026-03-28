# CLAUDE.md

## Workflow Rules

- **Every issue or feature MUST have a GitHub issue before any work begins.**
- **Every change MUST go through a Pull Request (PR) — no direct commits to `main`.**
- The `main` branch is protected: PRs require at least 1 approving review.
- **Before creating a PR, always merge `main` into the feature branch** to ensure the latest changes are included.

## Labels

- **Every issue and every PR MUST have at least one label assigned.**
- Available labels: `bug`, `duplicate`, `enhancement`, `feature`, `refactor`

## Attribution

- **Never add Claude/AI as co-author, contributor, or any form of attribution in commits, PRs, or code.**

## Writing Issues

- Title starts with a verb: `Add`, `Fix`, `Refactor`, `Rename`, `Display`, etc.
- Keep it short and descriptive
- Must have at least one label (`feature`, `bug`, `enhancement`, `refactor`)
- Body is optional — only add details if the issue needs clarification

Examples:
- `Add Authentication and Controller Protection` → `feature`
- `Fix Calendar Page Crash` → `bug`
- `Refactor grade handling to use course grade directly` → `refactor`

## Writing Pull Requests

- Title matches the issue it resolves, starting with a past-tense verb: `Added`, `Fixed`, `Refactored`, etc.
- Body MUST contain `resolve #<issue-number>` to auto-close the linked issue
- Must have at least one label matching the issue
- One PR per issue — keep changes focused

Examples:
- Title: `Added Authentication and Controller/Query Protection` — Body: `resolve #197`
- Title: `Fixed Null Errors on Calendar Page` — Body: `resolve #200`
- Title: `Restructured Project` — Body: `resolve #182`

## Frontend

- **Always use `bun` — never `npm` or `yarn`.**
- Frontend lives in `src/AutexisCase.Frontend` (React + Vite + Tailwind CSS v4)
- API client is generated via [OpenAPI Generator](https://openapi-generator.tech) — run `bun run api:generate`
- Install deps: `cd src/AutexisCase.Frontend && bun install`
- Dev server: `bun run dev`
- Build: `bun run build`
- **Every frontend change MUST be verified using the Playwright MCP** before committing.

## Notifications

- **Play a chime sound when a task is completed OR when user input is needed.**
- This signals the user without requiring them to watch the terminal.

### Chime Commands

The choo-choo train sound is located at `scripts/choo-choo.wav`.

**Windows:**
```bash
powershell -c "(New-Object Media.SoundPlayer 'scripts/choo-choo.wav').PlaySync()"
```

**macOS:**
```bash
afplay scripts/choo-choo.wav
```

### When to play
Claude will run the appropriate chime command automatically when:
- A task or major step is completed
- User input or a decision is required

## Testing

- **Every command, query, and service MUST have unit tests.**
- Tests live in `src/AutexisCase.Tests`
- Use xUnit v3 with EF Core InMemory provider for handler tests
- Run tests: `dotnet test src/AutexisCase.Tests`

## Branch Naming

All branches must follow this convention:

```
feature/<issue-number>_PascalCaseName
```

Examples:
- `feature/12_AddUserAuthentication`
- `feature/5_FixDatabaseMigration`
- `feature/27_RefactorOrderService`
