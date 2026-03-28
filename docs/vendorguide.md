# Track my Food — Vendor Guide

Dieses Dokument richtet sich an **Hersteller, Produzenten und Händler** (nachfolgend „Vendoren"), die das Vendor Portal von Track my Food nutzen.

## Inhaltsverzeichnis

1. [Zugang zum Vendor Portal](#zugang-zum-vendor-portal)
2. [Dashboard-Übersicht](#dashboard-übersicht)
3. [Produktverwaltung](#produktverwaltung)
4. [Alert- und Rückruf-Management](#alert--und-rückruf-management)
5. [Kundenmeldungen](#kundenmeldungen)
6. [Demo-Zugang](#demo-zugang)

---

## Zugang zum Vendor Portal

### Rollenbasierte Zugriffskontrolle

Das Vendor Portal ist **ausschliesslich für Benutzer mit der Rolle `vendor` sichtbar**. Die Rollenzuweisung erfolgt über Keycloak-Gruppen:

1. Ein Administrator fügt den Benutzer der **Vendor-Gruppe** im Keycloak-Realm hinzu.
2. Beim nächsten Login erhält der Benutzer automatisch die `vendor`-Rolle im JWT-Token.
3. Die App erkennt die Rolle und blendet den Zugang zum Vendor Portal ein.

Benutzer ohne `vendor`-Rolle sehen nur die Consumer-App — der Menüpunkt „Vendor Portal" ist für sie nicht sichtbar.

### Anmeldung

1. Öffnen Sie die App unter `http://localhost:5173`.
2. Melden Sie sich mit Ihren Vendor-Zugangsdaten an.
3. Nach der Anmeldung erscheint im Navigationsmenü der Punkt **Vendor Portal**.
4. Klicken Sie darauf, um zum Dashboard zu gelangen.

> **Demo-Konto für Vendoren:**
> - Benutzername: `vendor-demo`
> - Passwort: `demo1234`
> - Rolle: Vendor (Consumer-App + Vendor Portal)

---

## Dashboard-Übersicht

Das Vendor Dashboard bietet eine Gesamtübersicht über alle Produkte, Alerts und Kundenmeldungen.

*Siehe Screenshot: `docs/screenshots/06-vendor-dashboard.png`*

### Bereiche des Dashboards

#### Produktstatus-Übersicht

Eine tabellarische Übersicht aller Produkte mit aktuellem Status:

| Status | Bedeutung | Visuelle Darstellung |
|---|---|---|
| **OK** | Keine Probleme erkannt | Grüner Indikator |
| **Warnung** | Risiko erkannt (z.B. Kühlkettenbruch) | Oranger Indikator |
| **Rückruf** | Aktiver Rückruf | Roter Indikator |

Jede Zeile zeigt: Produktname, GTIN, aktive Charge, Status und Anzahl offener Alerts.

#### Alert-Zusammenfassung

Aggregierte Darstellung aller aktiven Alerts:

- **Kritische Alerts** — Rückrufe, Kontaminationen
- **Warnungen** — Kühlkettenbrüche, Qualitätsabweichungen
- **Informationen** — Statusänderungen, neue Meldungen

#### Kundenmeldungen

Übersicht der neuesten Beanstandungen, die von Konsument:innen über die App eingereicht wurden.

---

## Produktverwaltung

### Produktliste

Die Produktliste zeigt alle Produkte, die dem Vendor zugeordnet sind:

- **Produktname** und **Marke**
- **GTIN** — Der eindeutige Barcode
- **Aktive Chargen** — Anzahl und Status der aktuellen Chargen
- **Letzte Aktivität** — Zeitpunkt des letzten Events

### Produktdetails

Durch Klick auf ein Produkt sehen Sie:

- Alle Chargen mit jeweiligem Status
- Journey-Events der einzelnen Chargen
- Temperaturprotokolle
- Aktive Alerts und Warnungen
- Eingegangene Kundenmeldungen

---

## Alert- und Rückruf-Management

### Alert-Typen

| Typ | Beschreibung | Beispiel |
|---|---|---|
| **ColdChain** | Kühlkettenunterbrechung | Temperatur stieg auf 24°C während des Transports |
| **Recall** | Produktrückruf | Metallfremdkörper in Charge BM-2026-0087 |

### Alert-Schweregrade

| Schweregrad | Bedeutung |
|---|---|
| **Information** | Hinweis ohne unmittelbaren Handlungsbedarf |
| **Warnung** | Potenzielles Risiko, Überwachung erforderlich |
| **Kritisch** | Sofortige Massnahmen erforderlich (z.B. Rückruf) |

### Rückruf-Ablauf

Bei einem kritischen Alert:

1. Der Alert erscheint prominent im Dashboard mit roter Kennzeichnung.
2. Die betroffene Charge wird automatisch auf den Status **Rückruf** gesetzt.
3. Konsument:innen, die das Produkt scannen, sehen sofort den Rückruf-Status.
4. Im Alert sind Details zum Problem und empfohlene Massnahmen hinterlegt.
5. Betroffene Chargen werden in der Produktliste visuell hervorgehoben.

### Beispiel: Rückruf „Bio Crunchy Müesli"

In den Demo-Daten ist ein vollständiger Rückruf-Fall abgebildet:

- **Produkt:** Bio Crunchy Müesli (Familia), GTIN 7613035839427
- **Charge:** BM-2026-0087
- **Problem:** Edelstahlsplitter (≤3mm) aus defektem Sieb an der Röstanlage
- **Massnahme:** Sofortiger Rückruf durch BLV, 12 Chargen betroffen
- **Status:** Zwei kritische Alerts (Qualitätskontrolle fehlgeschlagen + BLV-Rückruf)

---

## Kundenmeldungen

### Eingehende Meldungen

Konsument:innen können über die App Beanstandungen zu Produkten einreichen. Diese Meldungen erscheinen im Vendor Dashboard und enthalten:

- **Produkt und Charge** — Welches Produkt und welche Charge betroffen ist
- **Kategorie** — Art des Problems (z.B. Qualität, Verpackung, Geschmack)
- **Beschreibung** — Freitext des Konsumenten
- **Zeitpunkt** — Wann die Meldung eingereicht wurde

### Bearbeitung

Meldungen können im Dashboard eingesehen und bearbeitet werden. Bei gehäuften Meldungen zu einer Charge kann der Vendor:

- Die Charge zur Überprüfung markieren
- Interne Untersuchungen einleiten
- Bei Bestätigung eines Problems einen Alert oder Rückruf auslösen

---

## Demo-Zugang

Für den Hackathon sind folgende Demo-Produkte mit verschiedenen Status konfiguriert:

| Produkt | Status | Alerts | Meldungen |
|---|---|---|---|
| Swiss Dark Chocolate 72% (Lindt) | Warnung | 1 (Kühlkettenbruch) | — |
| Feine Milchschokolade Pistazie (Frey/Migros) | OK | 0 | — |
| Bio Crunchy Müesli (Familia) | Rückruf | 2 (kritisch) | — |

Melden Sie sich mit dem Konto `vendor-demo` / `demo1234` an, um alle Funktionen des Vendor Portals zu testen.
