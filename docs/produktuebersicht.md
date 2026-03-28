# Track my Food — Produktübersicht

## Inhaltsverzeichnis

1. [Einleitung](#einleitung)
2. [Problemstellung](#problemstellung)
3. [Zielgruppen](#zielgruppen)
4. [Lösung](#lösung)
5. [Kernfunktionen](#kernfunktionen)
6. [Differenzierung](#differenzierung)
7. [Aktuelle Features](#aktuelle-features)
8. [Roadmap](#roadmap)

---

## Einleitung

**Track my Food** ist eine Plattform zur Rückverfolgung von Lebensmitteln entlang der gesamten Lieferkette — vom Feld bis ins Verkaufsregal. Konsument:innen scannen im Laden einen Barcode und sehen sofort, woher ihr Produkt stammt, wie es transportiert wurde, ob die Kühlkette eingehalten wurde und ob Risiken oder Rückrufe vorliegen.

Das Projekt wurde im Rahmen des **{baden: hackt} 2026** Hackathons durch Team Autexis entwickelt und basiert auf GS1/EPCIS-Standards, modernen Web-Technologien und KI-gestützter Datenanalyse.

---

## Problemstellung

### Fehlende Transparenz in der Lebensmittellieferkette

Lebensmittel-Lieferketten sind für Konsument:innen fast vollständig unsichtbar. Ein QR-Code auf der Verpackung führt heute meist zu einer Marketingseite — nicht zu echten Daten über Herkunft, Transport oder Qualität. Gleichzeitig sind die Informationssysteme von Produzenten, Logistikern und Händlern fragmentiert und nicht für den Endkunden gedacht.

### Rückrufe erreichen Konsument:innen zu spät

Wenn ein Lebensmittelrückruf ausgelöst wird, erfahren Konsument:innen oft erst Tage später davon — wenn überhaupt. Die Kommunikation erfolgt über Pressemitteilungen, BLV-Webseiten oder Aushänge im Laden, die leicht übersehen werden.

### Reale Vorfälle in der Schweiz

Die Relevanz von Lebensmitteltransparenz zeigt sich an konkreten Fällen aus der jüngeren Vergangenheit:

- **Pferdefleisch-Skandal (2013):** In der gesamten EU, einschliesslich der Schweiz, wurde in Fertigprodukten (Lasagne, Bolognese) Pferdefleisch als Rindfleisch deklariert. Coop und Migros mussten Produkte aus den Regalen nehmen. Der Skandal offenbarte die Intransparenz globaler Fleisch-Lieferketten.

- **Listerien in Fertigsalaten (2016–2020):** Wiederholt wurden in vorverpackten Salaten von Schweizer Detailhändlern Listerien-Kontaminationen festgestellt. 2020 musste eine Charge von Migros zurückgerufen werden, nachdem bei internen Kontrollen Listerien nachgewiesen wurden. Die Rückverfolgung war aufwendig und dauerte Tage.

- **Ethylenoxid in Sesam (2020–2021):** Hunderte Produkte in der Schweiz und der EU wurden zurückgerufen, weil importierter Sesam mit dem Pflanzenschutzmittel Ethylenoxid belastet war. Der Vorfall betraf Dutzende Marken und zeigte, wie eine Kontamination am Anfang der Lieferkette erst spät erkannt wird.

- **Metallteilchen in Müesli (fiktiv, Demodaten):** Unser drittes Demo-Produkt (Bio Crunchy Müesli von Familia) simuliert einen realistischen Rückruf: Edelstahlsplitter aus einem defekten Sieb in der Röstanlage, erkannt durch den Metalldetektor bei einer Stichprobe. Der BLV ordnet einen sofortigen Rückruf für 12 Chargen an.

Diese Fälle zeigen: Eine Lösung, die Konsument:innen in Echtzeit über Risiken informiert und die Chargenrückverfolgung automatisiert, hat einen messbaren gesellschaftlichen Nutzen.

---

## Zielgruppen

### Primäre Zielgruppe: Konsument:innen

Ladenbesucher:innen, die wissen wollen, was sie kaufen. Sie scannen im Supermarkt ein Produkt und erhalten sofort Zugang zu:

- Herkunft und Lieferweg der konkreten Charge
- Temperaturverlauf während des Transports
- Aktive Warnungen oder Rückrufe
- Nährwerte, Nutri-Score und Nachhaltigkeitsdaten
- KI-gestützter Qualitätsprognose

### Sekundäre Zielgruppe: Vendoren und Produzenten

Hersteller und Händler nutzen das **Vendor Portal**, um ihre Produkte und Chargen zu überwachen:

- Übersicht aller Produkte mit aktuellem Status (OK / Warnung / Rückruf)
- Verwaltung von Rückrufen und Alerts
- Einsicht in Beanstandungen von Konsument:innen
- Rollenbasierter Zugang via Keycloak-Gruppen

---

## Lösung

Track my Food kombiniert drei Elemente zu einem einzigen, durchgängigen Nutzererlebnis:

### 1. Tracking — Die Reise sichtbar machen

Eine interaktive Karte zeigt die Reise einer Charge mit echten Routenlinien (OpenRouteService), cinematischen Kamerafahrten und einer scrollbaren Event-Timeline — vergleichbar mit Pakettracking, aber für Lebensmittel.

### 2. Risiko — Probleme sofort erkennen

Anomalie-Erkennung (Kühlkettenbrüche, Temperaturspitzen), Blockchain-Verifikation (SHA-256 Hash-Chain) und aktive Alerts machen Risiken sichtbar, bevor sie zum Problem werden.

### 3. Handlung — Direkt reagieren können

Konsument:innen können Beanstandungen melden, den KI-Chat zu ihrem Produkt nutzen und sich Alternativen anzeigen lassen. Vendoren sehen Meldungen im Dashboard und können Rückrufe verwalten.

---

## Kernfunktionen

### Für Konsument:innen

| Funktion | Beschreibung |
|---|---|
| **Barcode-Scanner** | Kamerabasiertes Scannen von EAN/GTIN-Codes (native BarcodeDetector + zxing-wasm Fallback) |
| **LOT-Erfassung** | KI-gestützte OCR extrahiert Chargennummern von der Verpackung (Semantic Kernel + Gemini Vision) |
| **Journey Map** | Cinematische MapLibre-GL-Karte mit Routenpolylinien, Fly-to-Animationen und Event-Cards |
| **Shelf-Life-Prognose** | KI-berechnete Qualitätskurve mit Risikofaktoren und Konfidenzwerten |
| **Anomalie-Erkennung** | Kühlkettenüberwachung mit Temperaturspitzen-Erkennung und Integritätsbewertung |
| **Nachhaltigkeit** | CO₂-Aufschlüsselung nach Lieferkettenstufe, Wasserfussabdruck, Transportdistanz, Verpackungsbewertung |
| **Blockchain-Verifikation** | SHA-256-Hash-Chain für manipulationssichere Lieferketten-Verifizierung |
| **Produkt-Chat (RAG)** | Fragen zu jedem Produkt stellen, basierend auf dem vollständigen Produktkontext |
| **Beanstandungen** | Mehrstufiger Melde-Flow, persistiert in der Datenbank |

### Für Vendoren

| Funktion | Beschreibung |
|---|---|
| **Quality Dashboard** | Übersicht aller Produkte, Alerts und Kundenmeldungen |
| **Rückruf-Management** | Kritische Alerts mit Schweregrad, automatisches Produkt-Flagging |
| **Kundenmeldungen** | Einsicht und Verwaltung von Konsumenten-Beanstandungen |
| **Rollenbasierter Zugang** | Nur Nutzer mit der `vendor`-Rolle sehen das Portal |

---

## Differenzierung

Track my Food unterscheidet sich von bestehenden Lösungen durch vier zentrale Aspekte:

### GS1-basierte Glaubwürdigkeit

Das Datenmodell basiert auf GS1/EPCIS 2.0 — dem internationalen Standard für Supply-Chain-Events. Produktidentität und Chargen sind standardisiert, Event-Daten folgen einem sauberen, branchenkonformen Modell. Das ist kein proprietärer Ansatz, sondern ein zukunftsfähiger Standard.

### Cinematic Journey UX

Statt eines trockenen Dashboards erleben Konsument:innen die Reise ihres Produkts auf einer cinematischen Karte mit fliessenden Animationen und einer scrollbaren Timeline. Der Wow-Faktor ist real und macht Transparenz emotional erlebbar.

### Tracking + Risiko + Handlung in einem Flow

Andere Lösungen trennen Information, Warnung und Reaktion. Track my Food führt sie in einem einzigen, durchgängigen Flow zusammen: Scannen → Verstehen → Handeln.

### Consumer-Sicht und Business-Sicht

Eine Plattform für beide Seiten: Konsument:innen sehen ihre Produktreise, Vendoren verwalten Qualität, Alerts und Kundenmeldungen. Keine separaten Systeme, ein gemeinsames Datenmodell.

---

## Aktuelle Features (Stand: März 2026)

### Consumer App

- Barcode-Scanner mit nativer BarcodeDetector-API und zxing-wasm-Fallback
- LOT-Erfassung per Kamera mit KI-OCR (Semantic Kernel + Gemini Vision)
- Interaktive Journey Map mit echten Strassenrouten (OpenRouteService)
- Shelf-Life-Vorhersage per KI
- Anomalie-Erkennung und Kühlkettenüberwachung
- Nachhaltigkeitsanalyse (CO₂, Wasser, Transport, Verpackung)
- Blockchain-Verifikation (SHA-256 Hash-Chain)
- Produkt-Chat mit RAG (Retrieval-Augmented Generation)
- Produktalternativen mit besserem Nachhaltigkeits- oder Nährwertprofil
- Beanstandungs-Flow mit Persistierung in der Datenbank

### Vendor Portal

- Rollenbasierter Zugang via Keycloak-Gruppen
- Produktübersicht mit Status (OK / Warnung / Rückruf)
- Alert-Management mit Schweregrad
- Einsicht in Konsumenten-Beanstandungen

### Standards und Integrationen

- GS1/EPCIS 2.0 (ObjectEvent, bizStep, disposition)
- OpenRouteService für Routenpolylinien mit intelligentem Caching (30 Tage TTL)
- Open Food Facts für automatisches Abrufen unbekannter GTINs
- Keycloak OIDC mit Custom-Theme, PKCE und rollenbasiertem Zugang

### Demo-Daten

Drei realitätsnahe Produkte mit vollständigen Lieferketten:

| GTIN | Produkt | Status | Besonderheit |
|---|---|---|---|
| 7610848001015 | Swiss Dark Chocolate 72% (Lindt) | Warnung | Kühlkettenbruch bei 24°C auf der Autobahn A5 |
| 7616500663992 | Feine Milchschokolade Pistazie (Frey/Migros) | OK | 9 Stationen, reale Daten (Necaayo-Kooperative, Delica/Chocolat Frey, MVB Suhr) |
| 7613035839427 | Bio Crunchy Müesli (Familia) | Rückruf | Metallfremdkörper, BLV-Rückruf, 12 Chargen betroffen |

---

## Roadmap

### Phase 2 — Geplante Erweiterungen

| Feature | Beschreibung |
|---|---|
| **Quittungsscan** | Bon scannen, alle gekauften Produkte mit Status anzeigen |
| **Push-Benachrichtigungen** | Echtzeit-Alerts bei Rückrufen für bereits gescannte Produkte |
| **Multi-Sprach-Support** | Deutsch, Französisch, Italienisch, Englisch |
| **Erweiterte Vendor-Analysen** | Trends, Heatmaps, Prognosen für Qualitätsprobleme |
| **IoT-Integration** | Direkte Anbindung von Temperatursensoren und GPS-Trackern |

### Phase 3 — Vision

| Feature | Beschreibung |
|---|---|
| **ERP-Integration** | Anbindung an bestehende Warenwirtschaftssysteme (SAP, Microsoft Dynamics) |
| **Offizielle GS1-Zertifizierung** | Zertifizierte EPCIS-2.0-Konformität |
| **B2B-API** | API für Drittanbieter und Handelspartner |
| **Mobile Apps** | Native iOS- und Android-Apps mit Offline-Fähigkeit |
| **Regulatorische Anbindung** | Direkte Schnittstelle zu BLV und RASFF |

---

## Erfolgsmetrik

Die Jury versteht in unter 30 Sekunden:

1. **Was das Problem ist** — Lebensmittellieferketten sind intransparent, Rückrufe kommen zu spät.
2. **Warum die UX besonders ist** — Cinematische Journey Map statt trockenes Dashboard.
3. **Warum die Lösung realistisch ist** — GS1/EPCIS-Standards, echte Routen, reale Produktdaten.
4. **Was der Wow-Moment ist** — Ein Scan zeigt die ganze Geschichte einer Charge, inklusive Risiken und sofortiger Handlungsmöglichkeit.

---

## Kontakt

**Team Autexis** — {baden: hackt} 2026

Projekt-Repository: [github.com/PianoNic/AutexisCase](https://github.com/PianoNic/AutexisCase)
