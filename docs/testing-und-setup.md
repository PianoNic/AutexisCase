# Track my Food — Testing und Setup

Dieses Dokument beschreibt die Einrichtung der Entwicklungsumgebung, die Ausführung der Testsuite und die verfügbaren Demo-Daten.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Infrastruktur starten](#infrastruktur-starten)
3. [Secrets konfigurieren](#secrets-konfigurieren)
4. [Backend starten](#backend-starten)
5. [Frontend starten](#frontend-starten)
6. [Demo-Konten](#demo-konten)
7. [Seed-Daten](#seed-daten)
8. [Testsuite](#testsuite)
9. [CI-Pipeline](#ci-pipeline)
10. [API-Endpunkte](#api-endpunkte)
11. [Fehlerbehebung](#fehlerbehebung)

---

## Voraussetzungen

Folgende Software muss installiert sein:

| Software | Version | Download |
|---|---|---|
| **.NET SDK** | 10.0 | [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) |
| **Bun** | Aktuell | [bun.sh](https://bun.sh) |
| **Docker** | Aktuell | [docker.com/get-started](https://www.docker.com/get-started) |
| **Docker Compose** | v2+ | In Docker Desktop enthalten |
| **Java** | 11+ | Für den OpenAPI Generator |

### Optionale Tools

| Software | Zweck |
|---|---|
| **Git** | Versionskontrolle |
| **VS Code / Rider** | IDE mit .NET- und React-Support |
| **Postman / Bruno** | API-Testing |

---

## Infrastruktur starten

Die Infrastruktur (PostgreSQL und Keycloak) wird via Docker Compose bereitgestellt:

```bash
cd AutexisCase
docker compose -f compose.dev.yml up -d
```

### Gestartete Services

| Service | Container | Port | Zugangsdaten |
|---|---|---|---|
| **PostgreSQL 18** | `autexiscase-postgres` | 5433 | User: `autexiscase`, Passwort: `devpassword`, DB: `autexiscasedb-dev` |
| **Keycloak 26** | `autexiscase-keycloak` | 8180 | Admin: `admin` / `admin` |

### Keycloak-Konfiguration

Keycloak importiert automatisch beim Start:

- **Realm:** `autexiscase` (aus `config/keycloak/realm-export.json`)
- **Demo-Benutzer:** `vendor-demo` und `user-demo`
- **Client:** `autexiscase-app` (Public Client, PKCE)
- **Gruppen:** `vendor`-Gruppe für rollenbasierten Zugriff
- **Theme:** Custom Login-Theme mit Track-my-Food-Branding

### Status prüfen

```bash
# Container-Status
docker compose -f compose.dev.yml ps

# Keycloak erreichbar?
curl http://localhost:8180/realms/autexiscase/.well-known/openid-configuration

# PostgreSQL erreichbar?
docker exec autexiscase-postgres pg_isready -U autexiscase
```

---

## Secrets konfigurieren

Das Backend verwendet **.NET User Secrets** für die lokale Konfiguration. Secrets werden **nicht** im Repository gespeichert.

```bash
cd src/AutexisCase.API

# Datenbankverbindung
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5433;Database=autexiscasedb-dev;Username=autexiscase;Password=devpassword"

# Keycloak OIDC
dotnet user-secrets set "Oidc:Authority" "http://localhost:8180/realms/autexiscase"
dotnet user-secrets set "Oidc:ClientId" "autexiscase-app"
dotnet user-secrets set "Oidc:RequireHttpsMetadata" "false"

# KI-Dienste (OpenRouter)
dotnet user-secrets set "OpenRouter:ApiKey" "<Ihr-OpenRouter-API-Key>"
dotnet user-secrets set "OpenRouter:Model" "google/gemini-2.0-flash-001"

# Routenberechnung (OpenRouteService)
dotnet user-secrets set "OpenRouteService:ApiKey" "<Ihr-ORS-API-Key>"
```

### API-Keys beschaffen

| Dienst | Registrierung | Kosten |
|---|---|---|
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) | Pay-per-Use (Gemini 2.0 Flash: ~$0.10/1M Tokens) |
| **OpenRouteService** | [openrouteservice.org](https://openrouteservice.org) | Kostenloser Plan verfügbar (2'000 Requests/Tag) |

> **Hinweis:** Die App funktioniert auch ohne KI-API-Keys — die KI-Funktionen (Chat, OCR, Journey-Beschreibungen) sind dann nicht verfügbar, aber alle anderen Features (Karte, Timeline, Blockchain, Nachhaltigkeit) funktionieren weiterhin.

---

## Backend starten

```bash
dotnet run --project src/AutexisCase.API
```

Das Backend startet auf `http://localhost:5067` und führt beim ersten Start automatisch aus:

1. **Datenbank-Migration** — EF Core erstellt alle Tabellen
2. **Seed-Daten** — 3 Demo-Produkte mit vollständigen Lieferketten werden eingefügt
3. **EPCIS-Seed** — EPCIS-2.0-Events für die Demo-Produkte

### Verfügbare URLs

| URL | Beschreibung |
|---|---|
| `http://localhost:5067/swagger` | Swagger UI / API-Dokumentation |
| `http://localhost:5067/swagger/v1/swagger.json` | OpenAPI-Spezifikation |

---

## Frontend starten

```bash
cd src/AutexisCase.Frontend

# Abhängigkeiten installieren
bun install

# API-Client generieren (Backend muss laufen)
bun run api:generate

# Entwicklungsserver starten
bun run dev
```

Die App ist erreichbar unter `http://localhost:5173`.

### Produktions-Build

```bash
cd src/AutexisCase.Frontend
bun run build
```

Der Build wird in `dist/` erstellt und kann mit jedem statischen Webserver ausgeliefert werden.

---

## Demo-Konten

Zwei vorkonfigurierte Benutzer stehen zur Verfügung:

### Konsument

| Feld | Wert |
|---|---|
| **Benutzername** | `user-demo` |
| **Passwort** | `demo1234` |
| **Rolle** | Konsument |
| **Zugang** | Consumer-App (Scan, Produktseite, Chat, Meldungen) |
| **Kein Zugang zu** | Vendor Portal |

### Vendor

| Feld | Wert |
|---|---|
| **Benutzername** | `vendor-demo` |
| **Passwort** | `demo1234` |
| **Rolle** | Vendor |
| **Zugang** | Consumer-App + Vendor Portal |
| **Zusätzliche Funktionen** | Dashboard, Alert-Management, Kundenmeldungen |

---

## Seed-Daten

Beim ersten Start werden drei realitätsnahe Demo-Produkte in die Datenbank geschrieben. Die Seed-Daten werden bei jedem Start geprüft und nur eingefügt, wenn die Datenbank leer ist. Sie überleben Datenbank-Drops (werden beim nächsten Start neu erstellt).

### Produkt 1: Swiss Dark Chocolate 72% (Lindt)

| Feld | Wert |
|---|---|
| **GTIN** | 7610848001015 |
| **LOT** | LX-2026-0142 |
| **Status** | Warnung |
| **Risikobewertung** | 72% |
| **Route** | Ghana → Belgien → Deutschland → Schweiz |
| **Stationen** | 5 (Ernte, Verarbeitung, Transport, Lager, Regal) |
| **Besonderheit** | Kühlkettenbruch auf der A5 (Temperatur stieg auf 24°C für 3h) |
| **Nutri-Score** | D |
| **CO₂** | 2.3 kg |

### Produkt 2: Feine Milchschokolade Pistazie (Frey/Migros)

| Feld | Wert |
|---|---|
| **GTIN** | 7616500663992 |
| **LOT** | MSA17CN |
| **Status** | OK |
| **Risikobewertung** | 12% |
| **Route** | Elfenbeinküste → Türkei → Mittelmeer → Schweiz |
| **Stationen** | 9 (Kakao-Ernte, Pistazien, Haselnüsse, Seetransport, Milch, Verarbeitung, Zentrallager, Transport, Regal) |
| **Besonderheit** | Vollständige Lieferkette mit realen Daten (Necaayo-Kooperative, Delica/Chocolat Frey, MVB Suhr AG) |
| **Nutri-Score** | E |
| **CO₂** | 3.1 kg |

### Produkt 3: Bio Crunchy Müesli (Familia)

| Feld | Wert |
|---|---|
| **GTIN** | 7613035839427 |
| **LOT** | BM-2026-0087 |
| **Status** | Rückruf |
| **Risikobewertung** | 98% |
| **Route** | Thurgau → Sachseln OW → Schweizweit (Rückruf) |
| **Stationen** | 3 (Ernte, Verarbeitung/Rückruf, Rückrufmeldung) |
| **Besonderheit** | Edelstahlsplitter (≤3mm) aus defektem Sieb, BLV-Rückruf Nr. 2026-0341, 12 Chargen betroffen |
| **Nutri-Score** | B |
| **CO₂** | 0.8 kg |
| **Alerts** | 2 kritische (Qualitätskontrolle fehlgeschlagen + Produktrückruf) |

---

## Testsuite

### Übersicht

Die Testsuite umfasst **44 xUnit-Tests** und deckt alle kritischen Pfade ab.

### Tests ausführen

```bash
dotnet test src/AutexisCase.Tests
```

### Testbereiche

| Bereich | Abgedeckte Funktionalität |
|---|---|
| **Query-Handler** | Produkt-, Chargen-, Blockchain-, Shelf-Life-, Anomalie-, Nachhaltigkeits- und Alternativen-Abfragen |
| **Command-Handler** | Scan-Registrierung, Beanstandungen melden |
| **RoutingService** | Caching, Great-Circle-Arc-Berechnung, ORS-Response-Parsing, Fallback-Strategien |
| **EpcisEventMapper** | EPCIS-2.0-Formatvalidierung, bizStep-Mapping |

### Test-Infrastruktur

- **Framework:** xUnit v3
- **Datenbank:** EF Core InMemory Provider (keine echte Datenbank nötig)
- **Mocking:** Standard .NET Mocking (kein externes Framework)
- **Parallelisierung:** Tests laufen parallel für schnelle Ausführung

### Einen einzelnen Test ausführen

```bash
dotnet test src/AutexisCase.Tests --filter "FullyQualifiedName~GetProductByIdQueryHandlerTests"
```

---

## CI-Pipeline

### GitHub Actions

Die CI-Pipeline wird automatisch ausgelöst bei:

- **Pull Requests** auf `main`
- **Pushes** auf `main`

### Pipeline-Schritte

1. **Checkout** — Repository klonen
2. **Setup .NET 10** — SDK installieren
3. **Restore** — NuGet-Abhängigkeiten wiederherstellen
4. **Build** — Release-Build erstellen
5. **Test** — Alle 44 Tests ausführen

### Merge-Gate

- PRs können **nur gemergt werden**, wenn alle Tests bestehen.
- Der `main`-Branch ist geschützt und erfordert mindestens 1 Approving Review.

---

## API-Endpunkte

Alle Endpunkte erfordern eine gültige JWT-Authentifizierung. Die vollständige API-Dokumentation ist unter `http://localhost:5067/swagger` verfügbar.

### Produkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/Product` | Alle Produkte |
| `GET` | `/api/Product/{id}` | Produkt per ID |
| `GET` | `/api/Product/gtin/{gtin}` | Produkt per GTIN |
| `GET` | `/api/Product/{id}/alternatives` | Produktalternativen |
| `POST` | `/api/Product/{id}/chat` | Produkt-Chat (RAG) |
| `POST` | `/api/Product/{id}/report` | Beanstandung melden |

### Chargen

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/Product/batch/{id}` | Charge per ID |
| `GET` | `/api/Product/batch/lookup` | Charge per GTIN + LOT |
| `GET` | `/api/Product/batch/{id}/route` | Routenpolylinien |
| `GET` | `/api/Product/batch/{id}/blockchain` | Hash-Chain-Verifikation |
| `GET` | `/api/Product/batch/{id}/shelf-life` | Shelf-Life-Prognose |
| `GET` | `/api/Product/batch/{id}/anomalies` | Anomalie-Erkennung |
| `GET` | `/api/Product/batch/{id}/sustainability` | Nachhaltigkeitsanalyse |

### Scan und EPCIS

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `POST` | `/api/Scan/{gtin}` | Scan registrieren |
| `POST` | `/api/Epcis/events` | EPCIS-Events erfassen |
| `GET` | `/api/Epcis/events` | EPCIS-Events abfragen |
| `POST` | `/api/Ocr/lot` | LOT per KI-OCR extrahieren |

---

## Fehlerbehebung

### Keycloak startet nicht

```bash
# Logs prüfen
docker logs autexiscase-keycloak

# Container neu starten
docker compose -f compose.dev.yml restart keycloak
```

Häufige Ursache: Port 8180 ist bereits belegt. Prüfen Sie mit `netstat -an | grep 8180`.

### Datenbank-Verbindung schlägt fehl

1. Prüfen Sie, ob der PostgreSQL-Container läuft: `docker compose -f compose.dev.yml ps`
2. Prüfen Sie die User Secrets: `dotnet user-secrets list --project src/AutexisCase.API`
3. Stellen Sie sicher, dass Port 5433 nicht blockiert ist.

### API-Client-Generierung schlägt fehl

1. Stellen Sie sicher, dass das Backend läuft (`dotnet run --project src/AutexisCase.API`).
2. Prüfen Sie, ob Swagger erreichbar ist: `curl http://localhost:5067/swagger/v1/swagger.json`
3. Stellen Sie sicher, dass Java 11+ installiert ist: `java -version`

### Frontend zeigt leere Seite

1. Prüfen Sie die Browser-Konsole auf Fehler.
2. Stellen Sie sicher, dass der API-Client generiert wurde: `bun run api:generate`
3. Prüfen Sie, ob das Backend erreichbar ist.

### Login funktioniert nicht

1. Prüfen Sie, ob Keycloak erreichbar ist: `http://localhost:8180`
2. Stellen Sie sicher, dass der Realm `autexiscase` importiert wurde.
3. Prüfen Sie die OIDC-Konfiguration in den User Secrets.
