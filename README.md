# Track my Food

**Scanne. Verfolge. Vertraue.** — KI-gestützter Lebensmittel-Tracker, vom Feld bis ins Regal.

> **{baden: hackt} 2026** — Team Autexis

<video src="https://github.com/PianoNic/AutexisCase/raw/main/docs/demo.mp4" controls width="100%"></video>

| Login | Produkt-Journey | Vendor Dashboard |
|:---:|:---:|:---:|
| ![Login](docs/screenshots/01-login.png) | ![Produkt](docs/screenshots/04-product-map.png) | ![Vendor](docs/screenshots/06-vendor-dashboard.png) |

---

## Das Problem

Lebensmittelskandale wie der Pferdefleischskandal (2013), Listerien-Rückrufe oder Ethylenoxid-Kontaminationen zeigen: Konsumenten haben heute kaum Möglichkeiten, die Herkunft und Sicherheit ihrer Lebensmittel selbst zu überprüfen. Lieferketten sind komplex, intransparent und oft erst nach einem Vorfall nachvollziehbar.

## Unsere Lösung

**Track my Food** macht die gesamte Lieferkette eines Produkts mit einem einzigen Barcode-Scan sichtbar — von der Ernte bis ins Regal. Konsumenten erhalten sofort Transparenz, Vendoren ein mächtiges Qualitäts-Dashboard.

---

## Kernfunktionen

| Feature | Mehrwert |
|---------|----------|
| **Barcode + LOT-Scan (KI-OCR)** | Produkt und Charge in Sekunden identifizieren — auch handgeschriebene LOT-Nummern per KI-Vision |
| **Cinematic Journey-Karte** | Interaktive MapLibre-Karte zeigt jeden Schritt der Lieferkette mit echten Routen |
| **Haltbarkeitsprognose** | KI-gestützte Qualitätskurve mit Risikofaktoren und Konfidenzwerten |
| **Kühlketten-Anomalieerkennung** | Automatische Erkennung von Temperaturspitzen mit Integritäts-Score |
| **CO₂-Nachhaltigkeitsanalyse** | CO₂-Aufschlüsselung pro Lieferkettenschritt, Wasserfussabdruck, Transportdistanz |
| **Blockchain-Verifizierung** | SHA-256-Hashkette — jeder Schritt kryptografisch mit dem vorherigen verknüpft |
| **RAG-Produkt-Chat** | KI-Chatbot beantwortet Fragen basierend auf echten Produktdaten |
| **EPCIS 2.0 (GS1-Standard)** | Lieferkettenevents im internationalen GS1-Format für Interoperabilität |
| **Vendor Portal mit RBAC** | Rollenbasiertes Dashboard für Qualitätskontrolle, Rückrufe und Kundenmeldungen |

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

## Vision

> Track my Food ist erst der Grundstein. Die Plattform kann in vielen Bereichen weiterentwickelt werden — von der automatischen Überwachung ganzer Lieferketten über IoT-Sensorik (Temperatur, Feuchtigkeit, GPS) bis zur vollständigen Integration mit Retailern und Behörden. Ziel: **Jedes Produkt im Regal automatisch überwacht, jeder Rückruf in Echtzeit an betroffene Konsumenten kommuniziert.** Was heute ein Barcode-Scan ist, kann morgen ein lückenloses Sicherheitsnetz für die gesamte Lebensmittelbranche sein.

---

<p align="center"><sub>Gebaut mit .NET 10 · React 19 · PostgreSQL · Keycloak · Semantic Kernel</sub></p>
