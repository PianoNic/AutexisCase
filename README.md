# Track my Food

**Scanne. Verfolge. Vertraue.** — KI-gestützter Lebensmittel-Tracker, vom Feld bis ins Regal.

> **{baden: hackt} 2026** — Team Autexis

| Login | Produkt-Journey | Vendor Dashboard |
|:---:|:---:|:---:|
| ![Login](docs/screenshots/01-login.png) | ![Produkt](docs/screenshots/04-product-map.png) | ![Vendor](docs/screenshots/06-vendor-dashboard.png) |

---

## Was ist Track my Food?

Konsumenten scannen einen Barcode, sehen die gesamte Reise ihres Lebensmittels auf einer interaktiven Karte, verifizieren die Lieferkette per Blockchain und können einem KI-Chatbot Fragen zum Produkt stellen. Vendoren erhalten ein rollenbasiertes Dashboard zur Qualitätskontrolle, Rückrufverwaltung und Bearbeitung von Kundenmeldungen.

**Kernfunktionen:** Barcode + LOT-Scan (KI-OCR) · cinematic Journey-Karte · Haltbarkeitsprognose · Kühlketten-Anomalieerkennung · CO₂-Nachhaltigkeitsanalyse · Blockchain-Verifizierung · RAG-Produkt-Chat · EPCIS 2.0 · Vendor Portal mit RBAC

---

## Tech Stack

| | |
|---|---|
| **Frontend** | React 19, Vite, Tailwind v4, shadcn/ui, MapLibre GL |
| **Backend** | .NET 10, Clean Architecture, CQRS, Semantic Kernel |
| **Datenbank** | PostgreSQL 18, EF Core 10, OpenAPI |
| **Auth** | Keycloak 26 (OIDC, PKCE, rollenbasierter Vendor-Zugang) |
| **KI** | Gemini 2.0 Flash via OpenRouter (OCR + RAG-Chat) |
| **Standards** | GS1/EPCIS 2.0, OpenRouteService |
| **Qualität** | 44 xUnit-Tests, CI/CD-Gate bei PRs |

---

## Schnellstart

```bash
git clone https://github.com/PianoNic/AutexisCase.git
cd AutexisCase
docker compose -f compose.dev.yml up -d    # PostgreSQL + Keycloak
dotnet run --project src/AutexisCase.API    # Backend
cd src/AutexisCase.Frontend && bun install && bun run dev  # Frontend
```

**Demo-Login:** `vendor-demo` / `demo1234` (Vendor) oder `user-demo` / `demo1234` (Konsument)

> Vollständige Einrichtung unter [Testing & Setup](docs/testing-und-setup.md)

---

## Dokumentation

- **[Produktübersicht](docs/produktuebersicht.md)** — Problem, Zielgruppen, Nutzen, Roadmap
- **[Anwenderguide](docs/anwenderguide.md)** — Scan, LOT, Karte, Chat, Meldungen
- **[Vendorguide](docs/vendorguide.md)** — Dashboard, Rückrufe, Kundenmeldungen
- **[Technik & Betrieb](docs/technik-und-betrieb.md)** — Architektur, EPCIS, Blockchain, CI/CD
- **[Testing & Setup](docs/testing-und-setup.md)** — Setup, Demo-Accounts, Tests, API-Referenz

---

## Demo-Produkte

| Produkt | Status | Szenario |
|---------|--------|----------|
| Swiss Dark Chocolate 72% (Lindt) | Warnung | Kühlkettenbruch bei 24°C während Transport |
| Feine Milchschokolade Pistazie (Frey) | OK | 9-Schritte-Journey, echte Herkunftsdaten |
| Bio Crunchy Müesli (Familia) | **Rückruf** | Metallfremdkörper, BLV-Rückrufanordnung |

---

<p align="center"><sub>Gebaut mit .NET 10 · React 19 · PostgreSQL · Keycloak · Semantic Kernel</sub></p>
