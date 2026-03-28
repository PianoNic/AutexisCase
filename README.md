# Track my Food

AI-powered food supply chain tracker — from field to store shelf.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/get-started)
- Java 11+ (required by OpenAPI Generator)
- [OpenRouter](https://openrouter.ai) API key (for AI-powered LOT/OCR)

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
dotnet user-secrets set "Oidc:Authority" "http://localhost:8180/realms/autexiscase"
dotnet user-secrets set "Oidc:ClientId" "autexiscase-app"
dotnet user-secrets set "Oidc:RequireHttpsMetadata" "false"
dotnet user-secrets set "OpenRouter:ApiKey" "<your-openrouter-api-key>"
dotnet user-secrets set "OpenRouter:Model" "google/gemini-2.0-flash-001"
dotnet user-secrets set "OpenRouteService:ApiKey" "<your-ors-api-key>"
```

> Get a free ORS key at https://openrouteservice.org/dev/#/signup

### Demo Accounts (Keycloak)

| User | Password | Role | Access |
|------|----------|------|--------|
| `vendor-demo` | `demo1234` | Vendor | Vendor Portal + all features |
| `user-demo` | `demo1234` | User | Consumer features only |

Keycloak admin panel: `http://localhost:8180` (admin / admin)

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
bun run api:generate
```

This generates typed TypeScript API clients in `src/api/`.

### 7. Run the frontend

```bash
bun run dev
```

The frontend will be available at `http://localhost:5173`.

## Scan Flow

1. **Barcode scan** — Camera detects EAN/GTIN barcode (native BarcodeDetector or zxing-wasm fallback)
2. **LOT capture** — User photographs the LOT/batch number on the packaging
3. **AI extraction** — Image sent to vision LLM (via Semantic Kernel + OpenRouter) which extracts the LOT number
4. **Batch lookup** — Product + LOT matched to specific charge with full journey, alerts, temperatures
5. **Product page** — Shows supply chain journey on interactive map, sustainability metrics, alerts

Users can also enter the LOT number manually or skip the LOT step.

## Auth Flow

1. User opens the app → redirected to `/login`
2. Clicks "Anmelden" → redirected to OIDC provider (Pocket ID)
3. After login → redirected to `/callback`
4. Frontend syncs user with backend via `POST /api/Auth/sync`
5. User lands on home page showing their scanned products

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/Product` | List all products (summary) |
| `GET` | `/api/Product/{id}` | Full product with batches |
| `GET` | `/api/Product/gtin/{gtin}` | Lookup by barcode (auto-fetches from Open Food Facts) |
| `GET` | `/api/Product/batch/{batchId}` | Full batch with journey, prices, temps, alerts |
| `GET` | `/api/Product/batch/lookup?gtin=X&lot=Y` | Lookup batch by GTIN + LOT number |
| `GET` | `/api/Product/{id}/journey` | Journey events for a product |
| `GET` | `/api/Product/{id}/coordinates` | Map coordinates for journey |
| `POST` | `/api/Scan/{gtin}` | Record a barcode scan |
| `GET` | `/api/Scan/recent` | User's recent scans |
| `GET` | `/api/Scan/alerts` | Alerts for user's scanned products |
| `POST` | `/api/Ocr/lot` | Extract LOT number from image (AI vision) |
| `POST` | `/api/Epcis/events` | Capture EPCIS 2.0 events (JSON-LD) |
| `GET` | `/api/Epcis/events` | Query EPCIS events (`EQ_epc`, `EQ_bizStep`) |
| `GET` | `/api/App/config` | OIDC configuration (anonymous) |
| `POST` | `/api/Auth/sync` | Sync authenticated user to database |

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | .NET 10, ASP.NET Core, Entity Framework Core |
| **Frontend** | React 19, Vite, Tailwind CSS v4, shadcn/ui |
| **Database** | PostgreSQL 18 |
| **Auth** | OIDC/JWT via Pocket ID (PKCE) |
| **AI/OCR** | Microsoft Semantic Kernel + OpenRouter (vision LLM) |
| **Barcode** | Native BarcodeDetector API + zxing-wasm fallback |
| **Routing** | [OpenRouteService](https://openrouteservice.org) (truck/car route polylines) |
| **Product Data** | Open Food Facts (auto-fetch) |
| **Supply Chain** | GS1/EPCIS 2.0 event tracking (local storage) |
| **Architecture** | Clean Architecture, CQRS (Mediator), role-based authorization |

## OIDC Configuration (Keycloak)

| Setting | Value |
|---|---|
| Realm | `autexiscase` |
| Issuer | `http://localhost:8180/realms/autexiscase` |
| Client ID | `autexiscase-app` |
| PKCE | S256 |
| Roles | `vendor` (Vendor Portal access), `user` (consumer) |

### Callback URLs

- **Development**: `http://localhost:5173/*`
- **Production**: `https://<your-domain>/*`

### Keycloak Admin

- URL: `http://localhost:8180`
- Username: `admin`
- Password: `admin`
- Realm config auto-imported from `config/keycloak/realm-export.json`

## EPCIS Integration

The app implements [EPCIS 2.0](https://www.gs1.org/standards/epcis) (Electronic Product Code Information Services) for standardized supply chain event tracking.

### How it works

Journey events from the app's domain model are automatically mapped to EPCIS 2.0 ObjectEvents on startup:

| Journey Step | EPCIS bizStep | Disposition |
|---|---|---|
| Ernte / Farm | `commissioning` | `active` |
| Verarbeitung / Factory | `commissioning` | `active` |
| Transport / Truck | `shipping` | `damaged` (if warning) |
| Lager / Warehouse | `receiving` | `active` |
| Regal / Store | `retail_selling` | `sellable_accessible` |

Each event includes the product's EPC identifier (derived from GTIN + LOT), coordinates, timestamps, and extended data (temperature, CO2, cost).

### Querying events

```bash
# All events
GET /api/Epcis/events

# By product EPC
GET /api/Epcis/events?EQ_epc=urn:epc:id:sgtin:7610848001015.LX-2026-0142

# By business step
GET /api/Epcis/events?EQ_bizStep=shipping
```

Events are stored locally in PostgreSQL — no external EPCIS repository container is required.

## Docker (Production)

```bash
cp .env.example .env
# Edit .env with your production values
docker compose up --build
```

## Project Structure

```
src/
  AutexisCase.Domain/          # Entities (Product, Batch, JourneyEvent, Alert, User)
  AutexisCase.Application/     # Commands, Queries, DTOs, Mappers, Behaviors, Interfaces
  AutexisCase.Infrastructure/  # DbContext, Services (OCR, OpenFoodFacts), Migrations
  AutexisCase.API/             # Controllers, Middleware, Entry point
  AutexisCase.Frontend/        # React + Vite + Tailwind CSS + OIDC Auth
  AutexisCase.Tests/           # xUnit tests
```
