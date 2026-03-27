# AutexisCase - Project Overview

## Purpose
AutexisCase is a web application with a .NET 10 backend API and an Angular frontend. It uses OIDC/JWT authentication, PostgreSQL database, and is containerized with Docker.

## Tech Stack
- **Backend**: .NET 10 (C#), ASP.NET Core Web API
- **Frontend**: Angular (currently being rebuilt)
- **Database**: PostgreSQL 18, Entity Framework Core with Npgsql
- **Authentication**: OIDC/JWT Bearer (configurable authority)
- **Mediator**: Mediator.SourceGenerator (CQRS pattern)
- **Testing**: xUnit, EF Core InMemory provider, Coverlet
- **Containerization**: Docker multi-stage build, Docker Compose
- **CI/CD**: GitHub Actions (build-and-release, release-drafter, version-bump)

## Architecture
Clean Architecture with CQRS:
- `AutexisCase.Domain` — Entities (BaseEntity, User, Example)
- `AutexisCase.Application` — Commands, Queries, DTOs, Interfaces, Behaviors
- `AutexisCase.Infrastructure` — DbContext, Services
- `AutexisCase.API` — Controllers, Middleware, Program.cs entry point
- `AutexisCase.Tests` — xUnit test project
- `AutexisCase.Frontend` — Angular app

## Key Files
- Solution: `src/AutexisCase.API/AutexisCase.API.slnx`
- Entry point: `src/AutexisCase.API/Program.cs`
- Docker: `Dockerfile`, `compose.yml`, `compose.dev.yml`
- Environment: `.env.example`
