# AutexisCase

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/get-started)
- Java 11+ (required by OpenAPI Generator)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/PianoNic/AutexisCase.git
cd AutexisCase
```

### 2. Start the development database

```bash
docker compose -f compose.dev.yml up -d
```

This starts a PostgreSQL instance on port `5433`.

### 3. Configure user secrets

```bash
cd src/AutexisCase.API

dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5433;Database=autexiscasedb-dev;Username=autexiscase;Password=devpassword"
dotnet user-secrets set "Oidc:Authority" "https://auth.gaggao.com"
dotnet user-secrets set "Oidc:ClientId" "<your-client-id>"
dotnet user-secrets set "Oidc:RequireHttpsMetadata" "true"
```

> Ask a team member for the OIDC Client ID.

### 4. Run the backend

```bash
dotnet run --project src/AutexisCase.API
```

The API will be available at `http://localhost:5067`.
Swagger UI is available at `http://localhost:5067/swagger` in development mode.

### 5. Install frontend dependencies

```bash
cd src/AutexisCase.Frontend
bun install
```

### 6. Generate the API client

With the backend running:

```bash
curl -o openapi.json http://localhost:5067/swagger/v1/swagger.json
bun run api:generate
```

This generates typed TypeScript API clients in `src/api/generated/`.

### 7. Run the frontend

```bash
bun run dev
```

The frontend will be available at `http://localhost:5173`.

## OIDC Configuration

The application uses OIDC for authentication via [auth.gaggao.com](https://auth.gaggao.com).

| Setting | Value |
|---|---|
| Issuer | `https://auth.gaggao.com` |
| Authorization URL | `https://auth.gaggao.com/authorize` |
| Token URL | `https://auth.gaggao.com/api/oidc/token` |
| Userinfo URL | `https://auth.gaggao.com/api/oidc/userinfo` |
| End Session URL | `https://auth.gaggao.com/api/oidc/end-session` |
| Discovery URL | `https://auth.gaggao.com/.well-known/openid-configuration` |
| JWKS URL | `https://auth.gaggao.com/.well-known/jwks.json` |
| PKCE | Enabled |

### Callback URLs

Register these redirect URIs in your OIDC provider:

- **Development**: `http://localhost:5173/callback`
- **Production**: `https://<your-domain>/callback`

## Docker (Production)

```bash
cp .env.example .env
# Edit .env with your production values
docker compose up --build
```

## Project Structure

```
src/
  AutexisCase.Domain/          # Entities
  AutexisCase.Application/     # Commands, Queries, DTOs, Interfaces
  AutexisCase.Infrastructure/  # DbContext, Services
  AutexisCase.API/             # Controllers, Middleware, Entry point
  AutexisCase.Frontend/        # React + Vite + Tailwind CSS
  AutexisCase.Tests/           # xUnit tests
```
