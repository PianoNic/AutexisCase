# Suggested Commands

## Build and Run
- `dotnet build src/AutexisCase.API/AutexisCase.API.csproj` — Build the API
- `dotnet run --project src/AutexisCase.API` — Run the API locally
- `dotnet watch --project src/AutexisCase.API` — Run with hot reload

## Testing
- `dotnet test src/AutexisCase.Tests/AutexisCase.Tests.csproj` — Run all tests

## Docker
- `docker compose up --build` — Build and run production
- `docker compose -f compose.dev.yml up --build` — Build and run dev
- `docker build -t autexiscase .` — Build Docker image

## Database
- `dotnet ef migrations add Name --project src/AutexisCase.Infrastructure --startup-project src/AutexisCase.API` — Add migration
- `dotnet ef database update --project src/AutexisCase.Infrastructure --startup-project src/AutexisCase.API` — Apply migrations

## Utilities (Windows/bash)
- `git status` / `git log --oneline` / `git diff`
- `ls` / `cat` / `grep -r` / `find .`
