# Track my Food

**Scanne. Verfolge. Vertraue.** — AI-powered food supply chain transparency, from field to shelf.

> **{baden: hackt} 2026** — Team Autexis

| Login | Product Journey | Vendor Dashboard |
|:---:|:---:|:---:|
| ![Login](docs/screenshots/01-login.png) | ![Product](docs/screenshots/04-product-map.png) | ![Vendor](docs/screenshots/06-vendor-dashboard.png) |

---

## What it does

Consumers scan a barcode, see the full journey of their food on an interactive map, verify the supply chain via blockchain, and chat with an AI about the product. Vendors get a role-based dashboard for quality management, recalls, and customer reports.

**Key Features:** Barcode + LOT scan (AI OCR) · cinematic journey map · shelf life prediction · cold chain anomaly detection · CO2 sustainability analysis · blockchain verification · RAG product chat · EPCIS 2.0 · vendor portal with RBAC

---

## Tech Stack

| | |
|---|---|
| **Frontend** | React 19, Vite, Tailwind v4, shadcn/ui, MapLibre GL |
| **Backend** | .NET 10, Clean Architecture, CQRS, Semantic Kernel |
| **Data** | PostgreSQL 18, EF Core 10, OpenAPI |
| **Auth** | Keycloak 26 (OIDC, PKCE, role-based vendor access) |
| **AI** | Gemini 2.0 Flash via OpenRouter (OCR + RAG chat) |
| **Standards** | GS1/EPCIS 2.0, OpenRouteService |
| **Quality** | 44 xUnit tests, CI/CD gate on PRs |

---

## Quick Start

```bash
git clone https://github.com/PianoNic/AutexisCase.git
cd AutexisCase
docker compose -f compose.dev.yml up -d    # PostgreSQL + Keycloak
dotnet run --project src/AutexisCase.API    # Backend
cd src/AutexisCase.Frontend && bun install && bun run dev  # Frontend
```

**Demo login:** `vendor-demo` / `demo1234` (vendor) or `user-demo` / `demo1234` (consumer)

> Full setup instructions in [Testing & Setup](docs/testing-und-setup.md)

---

## Docs

- **[Produktübersicht](docs/produktuebersicht.md)** — Problem, Zielgruppen, Nutzen, Roadmap
- **[Anwenderguide](docs/anwenderguide.md)** — Scan, LOT, Karte, Chat, Meldungen
- **[Vendorguide](docs/vendorguide.md)** — Dashboard, Rückrufe, Kundenmeldungen
- **[Technik & Betrieb](docs/technik-und-betrieb.md)** — Architektur, EPCIS, Blockchain, CI/CD
- **[Testing & Setup](docs/testing-und-setup.md)** — Setup, Demo-Accounts, Tests, API-Referenz

---

## Demo Products

| Product | Status | Scenario |
|---------|--------|----------|
| Swiss Dark Chocolate 72% (Lindt) | Warning | Cold chain break at 24°C during transport |
| Feine Milchschokolade Pistazie (Frey) | OK | Clean 9-step journey, real ingredient origins |
| Bio Crunchy Müesli (Familia) | **Recall** | Metal fragments, BLV recall order |

---

<p align="center"><sub>Built with .NET 10 · React 19 · PostgreSQL · Keycloak · Semantic Kernel</sub></p>
