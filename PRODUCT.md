# Product – Track my Food

## Produktvision

Wir machen aus einem gewöhnlichen Produktsc([atx-she.github.io](https://atx-she.github.io/track-my-food-challenge/))ür Lebensmittel.
Konsument:innen sehen nicht nur Marketinginfos, sondern die echte Reise ihrer Charge, Risiken, Rückrufe und die nächste sinnvolle Handlung.

## Problem

Lebensmittel-Lieferketten sind für Konsument:innen unsichtbar und für Händler/Produzenten fragmentiert. Rückrufe und Risiken kommen oft zu spät oder sind schwer verständlich. Ein QR-Code auf dem Produkt liefert heute meist keine echte Transparenz.

## Zielnutzer

### Primär

- Ladenbesucher / Konsument:innen im Supermarkt

### Sekundär

- Produzenten / Marken
- Händler / Filialmitarbeitende

## Value Proposition

Ein Scan zeigt die Reise einer Charge, macht Risiken sofort verständlich und ermöglicht direkte Reaktion.

## Unser Differenziator

- **GS1-basierte Glaubwürdigkeit** im Datenmodell
- **Cinematic Journey UX** statt trockenes Dashboard
- **Tracking + Risiko + Handlung** in einem Flow
- **eine Consumer-Sicht und eine einfache Business-Sicht**

## Produktprinzip

Nicht Datenmasse, sondern Klarheit.
Nicht 20 Features, sondern 1 starker Flow.

## Hero Flow

1. Nutzer scannt ein Produkt.
2. Die App erkennt Produkt + Charge.
3. Eine Karte zeigt die Reise der Charge vom Ursprung bis ins Regal.
4. Unten führt eine scrollbare Event-Timeline durch die Stationen.
5. Ein Risiko- oder Recall-Event verändert den Status sichtbar.
6. Die Detailansicht erklärt, was passiert ist.
7. Nutzer kann direkt handeln: Beanstandung, mehr Infos, Alternativen.

## Hauptscreen-Struktur

### 1. Home / Scan

- Primäre CTA: Produkt scannen
- Sekundär: Quittung scannen
- optional: letzte gescannte Produkte

### 2. Produktseite

- oben: Karte
- unten: Drawer / Sheet mit Produktdetails
- scrollbare Journey-Events ähnlich Reisetagebuch / Pakettracking
- Klick auf Event öffnet Detailansicht

### 3. Business / Admin View

- betroffene Charge
- betroffene Filialen / Touchpoints
- Status: normal / warning / recall
- direkte Beanstandungen / Meldungen

## Inhalte auf der Produktseite

- Produktbild
- Produktname
- Status (ok / warning / recall)
- Nutri-Score
- Nährwerte
- Inhaltsstoffe
- ökologischer Fussabdruck
- Zertifikate / Labels
- Risiken / Warnungen
- alternative Produktempfehlungen
- Kontext-Chat / Food Assistant

## Scan-Modi

### Produktscan

führt direkt zur Produktseite mit Journey und Status

### Quittungsscan

zeigt eine Übersicht der gekauften Produkte mit jeweiligem Status; Klick auf ein Produkt öffnet dessen Produktseite

## AI-Funktionen

### Must-have AI

- kompakte Risiko-Erklärung in natürlicher Sprache
- Anomalie-Hinweis bei einem Risiko-Event

### Nice-to-have AI

- Konversationsmodus auf der Produktseite
- alternative Produktempfehlungen
- Shelf-Life / Qualitätsprognose

## GS1-Einsatz

Wir nutzen GS1 als glaubwürdiges Fundament für Identifikation und Traceability.
Für die Demo bedeutet das:

- Produktidentität und Charge sind standardisiert gedacht
- Event-Daten entlang der Lieferkette folgen einem sauberen Modell
- QR/Scan wirkt wie ein echter zukunftsfähiger Standard und nicht wie eine proprietäre Bastellösung

## Must-haves

- klarer Produktscan
- Journey-Karte
- scrollbare Event-Timeline
- sichtbarer Statuswechsel durch Risiko / Recall
- Detailansicht pro Event
- Produktdetails im Drawer
- einfache Aktion / Beanstandung
- eine kleine Business-Sicht

## Nice-to-haves

- Quittungsscan
- Food Assistant Chat
- alternative Produkte
- CO₂ / Nachhaltigkeitsansicht
- Mengen / Bohnen / Storytelling pro Schritt
- Temperatur- oder Kühlkettenchart

## Out of Scope

- komplexe Auth
- echte ERP-/IoT-Integration
- vollwertiges Admin-Portal
- generische Multi-Product-Plattform
- zu viele AI-Modi
- unzuverlässige Live-Computer-Vision-Experimente

## Design Direction

- polished, dark, modern, cinematic
- Karte als Hero
- klarer Drawer mit starker Informationshierarchie
- wenig Text, starke States, gute Motion
- Vertrauen und Sicherheit statt Spielerei

## Demo Script

1. Hook mit echter Schokolade / Produkt
2. Produkt scannen
3. Journey startet sofort
4. Nutzer scrollt durch Herkunft, Verarbeitung, Transport, Regal
5. Warnung erscheint bei einem Event
6. Detailansicht erklärt Risiko und Auswirkung
7. Nutzer sieht ökologische Infos und Produktdetails
8. Nutzer reagiert oder schaut alternative Produkte an
9. Wechsel in Business-Sicht: betroffene Charge / Filialen / Status

## Success Metric für den Hackathon

Die Jury versteht in unter 30 Sekunden:

- was das Problem ist
- warum die UX besonders ist
- warum die Lösung realistisch und wertvoll ist
- was der Wow-Moment ist

## Entscheidungsregel

Wenn ein Feature nicht die Demo klarer, schöner oder wertvoller macht, kommt es ins Parking Lot.
