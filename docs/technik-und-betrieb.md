# Track my Food — Technik und Betrieb

Dieses Dokument beschreibt die technische Architektur, den Technologie-Stack, die Projektstruktur und den Betrieb der Track-my-Food-Plattform.

## Inhaltsverzeichnis

1. [Architektur](#architektur)
2. [Projektstruktur](#projektstruktur)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Datenbank](#datenbank)
6. [Authentifizierung](#authentifizierung)
7. [API-Client-Generierung](#api-client-generierung)
8. [EPCIS-2.0-Integration](#epcis-20-integration)
9. [Blockchain-Verifikation](#blockchain-verifikation)
10. [KI-Dienste](#ki-dienste)
11. [Routing und Kartendienste](#routing-und-kartendienste)
12. [CI/CD](#cicd)
13. [Docker-Deployment](#docker-deployment)
14. [Sicherheit](#sicherheit)

---

## Architektur

Die Anwendung folgt den Prinzipien der **Clean Architecture** mit strikter Trennung der Verantwortlichkeiten:

```
                    Frontend (React 19)
  Vite | Tailwind CSS v4 | shadcn/ui | MapLibre GL
  OpenAPI-generierter TypeScript-Client
                       |
                  REST API (JWT)
                       |
                 Backend (.NET 10)
  ASP.NET Core | Clean Architecture | CQRS (Mediator)
  Entity Framework Core | Semantic Kernel
                       |
         +-------------+-------------+
         |                           |
    PostgreSQL 18              Keycloak 26
    + Route Cache              OIDC / JWT
    + EPCIS Events             RBAC
```

### Design Patterns

| Pattern | Einsatz |
|---|---|
| **Clean Architecture** | Strikte Schichtentrennung: Domain, Application, Infrastructure, API |
| **CQRS** | Commands (Schreiboperationen) und Queries (Leseoperationen) sind getrennt via Mediator |
| **Mediator Pattern** | Alle Requests werden über einen Mediator an die zuständigen Handler dispatcht |
| **Result Pattern** | Keine Exceptions für Kontrollfluss — typisierte `Result<T>`-Rückgabewerte |
| **Pipeline Behaviors** | Cross-Cutting Concerns (Auth, Validation) als Mediator-Behaviors |
| **Repository Pattern** | Datenzugriff über Entity Framework Core mit DbContext |

### Schichtmodell

**Domain Layer** (`AutexisCase.Domain`)
- Entities: `Product`, `Batch`, `JourneyEvent`, `Alert`, `TemperatureLog`, `Nutrition`, `PriceStep`, `ProductReport`, `ScanRecord`, `RouteCache`, `EpcisEvent`
- Enums: `ProductStatus`, `JourneyStatus`, `AlertType`, `AlertSeverity`
- Keine Abhängigkeiten zu anderen Schichten

**Application Layer** (`AutexisCase.Application`)
- Commands: `RecordScanCommand`, `CreateReportCommand`, `AskProductCommand`, `ExtractLotCommand`
- Queries: 20+ Query-Handler für Produkte, Chargen, Blockchain, Shelf-Life, Anomalien, Nachhaltigkeit, Routen, EPCIS
- DTOs: Datentransferobjekte für die API-Kommunikation
- Behaviors: `AuthorizationBehavior`, `ValidationBehavior`
- Interfaces: Service-Abstraktionen

**Infrastructure Layer** (`AutexisCase.Infrastructure`)
- `AutexisCaseDbContext`: Entity Framework Core DbContext
- Services: `ChatService`, `OcrService`, `RoutingService`, `EpcisService`, `EpcisEventMapper`, `OpenFoodFactsService`, `CurrentUserService`, `UserSyncService`, `JourneyDescriptionService`
- `SeedData`: Demo-Daten für drei Produkte
- `EpcisSeedData`: EPCIS-2.0-Events für die Demo
- Migrations: EF Core Migrations für PostgreSQL

**API Layer** (`AutexisCase.API`)
- ASP.NET Core Minimal-/Controller-API
- JWT-Bearer-Authentifizierung
- Swagger/OpenAPI-Dokumentation
- Middleware für Fehlerbehandlung

---

## Projektstruktur

```
AutexisCase/
├── src/
│   ├── AutexisCase.Domain/            # Entities, Enums
│   ├── AutexisCase.Application/       # Commands, Queries, DTOs, Behaviors
│   │   ├── Behaviors/                 # AuthorizationBehavior, ValidationBehavior
│   │   ├── Commands/                  # RecordScan, CreateReport, AskProduct, ExtractLot
│   │   ├── Queries/                   # 20+ Query-Handler
│   │   ├── Dtos/                      # Datentransferobjekte
│   │   ├── Interfaces/               # Service-Abstraktionen
│   │   ├── Mappers/                   # Entity-zu-DTO-Mapper
│   │   └── Models/                    # Hilfsmodelle
│   ├── AutexisCase.Infrastructure/    # DbContext, Services, Migrations
│   │   ├── Services/                  # 9 Service-Implementierungen
│   │   ├── Migrations/               # EF Core Migrations
│   │   ├── SeedData.cs               # 3 Demo-Produkte
│   │   └── EpcisSeedData.cs          # EPCIS-Events
│   ├── AutexisCase.API/              # Controller, Middleware, Program.cs
│   │   ├── Controllers/              # Product, Scan, Epcis, Ocr Controller
│   │   ├── Middleware/               # Fehlerbehandlung
│   │   └── Program.cs               # Konfiguration und DI-Setup
│   ├── AutexisCase.Frontend/         # React-Anwendung
│   │   └── src/
│   │       ├── api/                  # OpenAPI-generierter Client
│   │       ├── auth/                 # OIDC/Keycloak-Integration
│   │       ├── components/           # UI-Komponenten (layout, product, ui)
│   │       ├── hooks/                # Custom React Hooks
│   │       ├── pages/                # Route-Pages (home, login, callback)
│   │       ├── screens/              # Feature-Screens (Home, Scan, Product, Admin, etc.)
│   │       └── lib/                  # Utilities
│   └── AutexisCase.Tests/            # 44 xUnit-Tests
│       ├── Commands/                 # Command-Handler-Tests
│       ├── Queries/                  # Query-Handler-Tests
│       ├── Services/                 # Service-Tests (Routing, EPCIS)
│       └── Helpers/                  # Test-Utilities
├── config/
│   └── keycloak/                     # Realm-Export + Custom Login Theme
├── compose.yml                       # Produktions-Docker-Compose
├── compose.dev.yml                   # Entwicklungs-Docker-Compose
├── Dockerfile                        # Multi-Stage Docker Build
└── docs/                             # Dokumentation und Screenshots
```

---

## Backend

### Technologie-Stack

| Komponente | Version | Zweck |
|---|---|---|
| **.NET** | 10 | Laufzeitumgebung |
| **ASP.NET Core** | 10 | Web-Framework |
| **Entity Framework Core** | 10 | ORM / Datenzugriff |
| **Mediator** | — | CQRS-Implementierung |
| **Semantic Kernel** | — | KI-Integration (Chat, OCR, Shelf-Life, Anomalien) |

### API-Endpunkte (17 total)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/Product` | Alle Produkte auflisten |
| `GET` | `/api/Product/{id}` | Produkt mit Chargen laden |
| `GET` | `/api/Product/gtin/{gtin}` | Produkt per Barcode suchen (Auto-Fetch via Open Food Facts) |
| `GET` | `/api/Product/batch/{id}` | Charge mit Journey, Temperaturen, Alerts |
| `GET` | `/api/Product/batch/lookup` | Charge per GTIN + LOT suchen |
| `GET` | `/api/Product/batch/{id}/route` | Routenpolylinien (OpenRouteService) |
| `GET` | `/api/Product/batch/{id}/blockchain` | SHA-256-Hash-Chain |
| `GET` | `/api/Product/batch/{id}/shelf-life` | Shelf-Life-Prognose |
| `GET` | `/api/Product/batch/{id}/anomalies` | Anomalie-Erkennung |
| `GET` | `/api/Product/batch/{id}/sustainability` | CO₂-Aufschlüsselung |
| `GET` | `/api/Product/{id}/alternatives` | Produktalternativen |
| `POST` | `/api/Product/{id}/chat` | RAG-basierter Produkt-Chat |
| `POST` | `/api/Product/{id}/report` | Beanstandung melden |
| `POST` | `/api/Scan/{gtin}` | Scan registrieren |
| `POST` | `/api/Epcis/events` | EPCIS-Events erfassen |
| `GET` | `/api/Epcis/events` | EPCIS-Events abfragen |
| `POST` | `/api/Ocr/lot` | KI-LOT-Extraktion |

---

## Frontend

### Technologie-Stack

| Komponente | Version | Zweck |
|---|---|---|
| **React** | 19 | UI-Framework |
| **Vite** | 8 | Build-Tool und Dev-Server |
| **Tailwind CSS** | v4 | Utility-First CSS |
| **shadcn/ui** | — | UI-Komponentenbibliothek |
| **MapLibre GL JS** | 5 | Interaktive Kartendarstellung |
| **react-map-gl** | 8 | React-Wrapper für MapLibre |
| **oidc-client-ts** | 3 | OpenID Connect Client |
| **react-oidc-context** | 3 | React-Integration für OIDC |
| **zxing-wasm** | 3 | Barcode-Scanner-Fallback |
| **Recharts** | 3 | Diagramme und Visualisierungen |
| **Lucide React** | — | Icon-Bibliothek |

### Paketmanager

Es wird ausschliesslich **Bun** als Paketmanager verwendet — niemals npm oder yarn.

```bash
cd src/AutexisCase.Frontend
bun install          # Abhängigkeiten installieren
bun run dev          # Entwicklungsserver starten
bun run build        # Produktions-Build erstellen
bun run api:generate # API-Client neu generieren
```

### Screen-Architektur

| Screen | Datei | Beschreibung |
|---|---|---|
| Home | `HomeScreen.tsx` | Startseite mit Scan-Button und letzten Scans |
| Scan | `ScanScreen.tsx` | Kamera-basierter Barcode-Scanner |
| LOT-Erfassung | `LotCaptureScreen.tsx` | KI-OCR für Chargennummern |
| Produkt | `ProductScreen.tsx` | Hauptansicht mit Karte und Drawer |
| Verlauf | `HistoryScreen.tsx` | Scan-Verlauf |
| Profil | `ProfileScreen.tsx` | Benutzereinstellungen |
| Admin | `AdminScreen.tsx` | Vendor Dashboard |
| Admin-Produkte | `AdminProductsScreen.tsx` | Vendor Produktliste |

---

## Datenbank

### PostgreSQL 18

- **Entwicklung:** Port 5433 via Docker Compose
- **ORM:** Entity Framework Core 10 mit Code-First-Migrations
- **Seed-Daten:** 3 Demo-Produkte mit vollständigen Lieferketten, automatisch beim Start

### Entitäten

| Entity | Beschreibung |
|---|---|
| `Product` | Produkt mit GTIN, Name, Marke, Nährwerte, Nutri-Score |
| `Batch` | Charge mit LOT-Nummer, Status, Risikobewertung, Haltbarkeit |
| `JourneyEvent` | Station in der Lieferkette (Ernte, Verarbeitung, Transport, Regal) |
| `TemperatureLog` | Temperaturmessung mit Zeitpunkt und Ort |
| `Alert` | Warnung oder Rückruf mit Schweregrad |
| `PriceStep` | Kostenaufschlüsselung nach Lieferkettenstufe |
| `ProductReport` | Kundenmeldung/Beanstandung |
| `ScanRecord` | Registrierter Barcode-Scan |
| `RouteCache` | Gecachte OpenRouteService-Routen (30 Tage TTL) |
| `EpcisEvent` | EPCIS-2.0-Supply-Chain-Events |
| `Nutrition` | Nährwertinformationen |

---

## Authentifizierung

### Keycloak 26

Die Authentifizierung erfolgt über **Keycloak** als selbst-gehosteten Identity Provider:

| Aspekt | Detail |
|---|---|
| **Protokoll** | OpenID Connect (OIDC) |
| **Flow** | Authorization Code mit PKCE |
| **Token** | JWT (JSON Web Token) |
| **Realm** | `autexiscase` (automatisch importiert) |
| **Theme** | Custom Login-Theme mit Track-my-Food-Branding |
| **Rollen** | Über Keycloak-Gruppen (z.B. `vendor`-Gruppe) |
| **Port** | 8180 (Entwicklung) |

### Rollenmodell

| Rolle | Zugang |
|---|---|
| Konsument (Standard) | Consumer-App: Scan, Produktseite, Chat, Meldungen |
| Vendor | Consumer-App + Vendor Portal: Dashboard, Alerts, Meldungen |

### Token-Validierung

Das Backend validiert JWT-Tokens gegen den Keycloak-Realm:

- Issuer-Prüfung gegen die konfigurierte Authority
- Signaturprüfung via JWKS-Endpunkt
- Rollenbasierte Autorisierung über `AuthorizationBehavior` (Mediator Pipeline)

---

## API-Client-Generierung

Der Frontend-API-Client wird automatisch aus der OpenAPI-Spezifikation generiert:

1. Das Backend stellt eine OpenAPI-3.0-Spezifikation bereit (`/swagger/v1/swagger.json`).
2. Der **OpenAPI Generator** (`@openapitools/openapi-generator-cli`) generiert einen vollständigen TypeScript-Client.
3. Der generierte Client liegt unter `src/AutexisCase.Frontend/src/api/`.

```bash
# Client neu generieren (Backend muss laufen)
cd src/AutexisCase.Frontend
bun run api:generate
```

Vorteile:
- **Typsicherheit** — Vollständige TypeScript-Typen für alle DTOs und Endpunkte
- **Konsistenz** — Frontend und Backend sind immer synchron
- **Keine manuelle Arbeit** — Änderungen an der API werden automatisch übernommen

---

## EPCIS-2.0-Integration

Die Plattform implementiert den **GS1 EPCIS 2.0**-Standard für Supply-Chain-Events:

### Event-Typen

| EPCIS-Typ | Verwendung |
|---|---|
| **ObjectEvent** | Standardereignis für Lieferketten-Stationen |

### Felder

| Feld | Beschreibung |
|---|---|
| `eventType` | Typ des Events (z.B. `ObjectEvent`) |
| `eventTime` | Zeitpunkt des Events (ISO 8601) |
| `bizStep` | Geschäftsschritt (z.B. `urn:epcglobal:cbv:bizstep:shipping`) |
| `disposition` | Zustand der Ware (z.B. `urn:epcglobal:cbv:disp:in_transit`) |
| `readPoint` | Ort des Events |
| `epcList` | Betroffene Produkte/Chargen |

### API-Endpunkte

- `POST /api/Epcis/events` — Neue EPCIS-Events erfassen
- `GET /api/Epcis/events` — EPCIS-Events abfragen (mit Filtern)

### EpcisEventMapper

Der `EpcisEventMapper`-Service konvertiert interne Journey-Events in EPCIS-2.0-konforme Formate und umgekehrt. Er ist vollständig unit-getestet.

---

## Blockchain-Verifikation

Die Integrität der Lieferkettendaten wird durch eine **SHA-256-Hash-Chain** sichergestellt:

1. Jeder Journey-Event wird mit SHA-256 gehasht.
2. Der Hash des vorherigen Events fliesst in den nächsten Hash ein.
3. Eine Manipulation an einem Event würde alle nachfolgenden Hashes ungültig machen.
4. Die Verifikation prüft die gesamte Kette und meldet den Status.

Endpunkt: `GET /api/Product/batch/{id}/blockchain`

---

## KI-Dienste

### Semantic Kernel

Alle KI-Funktionen basieren auf **Microsoft Semantic Kernel** mit **OpenRouter** als LLM-Provider:

| Dienst | Beschreibung | Model |
|---|---|---|
| **ChatService** | RAG-basierter Produkt-Chat | Gemini 2.0 Flash |
| **OcrService** | LOT-Extraktion aus Verpackungsfotos | Gemini Vision |
| **JourneyDescriptionService** | Natürlichsprachliche Risiko-Erklärungen | Gemini 2.0 Flash |
| **Shelf-Life-Prognose** | Qualitätskurve mit Risikofaktoren | Berechnungsbasiert |
| **Anomalie-Erkennung** | Kühlkettenanalyse mit Temperaturspiken | Berechnungsbasiert |

### Konfiguration

```bash
dotnet user-secrets set "OpenRouter:ApiKey" "<api-key>"
dotnet user-secrets set "OpenRouter:Model" "google/gemini-2.0-flash-001"
```

---

## Routing und Kartendienste

### OpenRouteService

Echte Strassenrouten zwischen Lieferketten-Stationen werden via **OpenRouteService** berechnet:

- Routenprofile: LKW (truck) und PKW (driving-car)
- Polylinien werden als GeoJSON gespeichert
- **Intelligentes Caching:** Berechnete Routen werden in der Datenbank gecacht (30 Tage TTL)
- **Fallback:** Bei API-Fehlern wird ein Great-Circle-Arc (Grosskreisbogen) berechnet

### MapLibre GL JS

Die Kartendarstellung im Frontend nutzt **MapLibre GL JS**:

- Vektorbasierte Kartenrendering
- Routenpolylinien als GeoJSON-Layer
- Cinematische Fly-to-Animationen zwischen Stationen
- Stationsmarker mit Statusfarben
- Responsive Touch-/Maus-Interaktion

---

## CI/CD

### GitHub Actions

Die CI-Pipeline läuft bei jedem Push und Pull Request auf `main`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - Setup .NET 10
      - Restore Dependencies
      - Build (Release)
      - Run Tests (44 xUnit Tests)
```

- **Merge-Gate:** PRs können nur gemergt werden, wenn alle Tests bestehen.
- **Branch-Protection:** Der `main`-Branch erfordert mindestens 1 Approving Review.

---

## Docker-Deployment

### Entwicklung (compose.dev.yml)

Startet PostgreSQL und Keycloak für die lokale Entwicklung:

```bash
docker compose -f compose.dev.yml up -d
```

| Service | Image | Port |
|---|---|---|
| **PostgreSQL** | `postgres:18` | 5433 |
| **Keycloak** | `quay.io/keycloak/keycloak:26.1` | 8180 |

Keycloak importiert automatisch den konfigurierten Realm (`config/keycloak/realm-export.json`) mit Demo-Benutzern und Custom-Theme.

### Produktion (compose.yml + Dockerfile)

Für das Produktions-Deployment steht ein Multi-Stage Dockerfile zur Verfügung, das die gesamte Anwendung in einem optimierten Container baut.

---

## Sicherheit

### Massnahmen

| Bereich | Implementierung |
|---|---|
| **Authentifizierung** | Keycloak OIDC mit PKCE (kein Client-Secret im Frontend) |
| **Autorisierung** | JWT-basiert mit rollenspezifischen Pipeline-Behaviors |
| **API-Zugang** | Alle Endpunkte erfordern gültige JWT-Tokens |
| **Secrets** | .NET User Secrets für lokale Entwicklung (keine Secrets im Repository) |
| **Datenintegrität** | SHA-256-Hash-Chain für Lieferketten-Events |
| **CORS** | Konfiguriert für erlaubte Origins |
| **Dependency Management** | Automatische Updates via GitHub Dependabot |
