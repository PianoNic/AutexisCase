# Code Style and Conventions

## C# Style
- .NET 10 with nullable enabled and implicit usings
- Top-level statements in Program.cs
- PascalCase for types, methods, properties; camelCase for locals
- Keep code self-documenting, no excessive docstrings

## Architecture Patterns
- Clean Architecture: Domain -> Application -> Infrastructure -> API
- CQRS via Mediator.SourceGenerator
- ValidationBehavior pipeline for input validation
- Interface-based DI (IAppDbContext, ICurrentUserService, IUserSyncService)
- Global exception handling via GlobalExceptionHandler middleware

## Git and Workflow
- Branch naming: `feature/<issue-number>_PascalCaseName`
- Every change via PR, no direct commits to main
- Every issue/PR must have a label: bug, duplicate, enhancement, feature, refactor
- Issue titles: verb-first (Add, Fix, Refactor)
- PR titles: past-tense verb (Added, Fixed, Refactored)
- PR body must contain `resolve #<issue-number>`
- NEVER add AI/Claude attribution in commits or PRs
