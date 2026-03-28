# Track my Food — Anwenderguide

Dieses Dokument richtet sich an **Konsument:innen**, die Track my Food im Alltag nutzen möchten. Es erklärt die wichtigsten Funktionen Schritt für Schritt.

## Inhaltsverzeichnis

1. [Anmeldung](#anmeldung)
2. [Startseite](#startseite)
3. [Barcode scannen](#barcode-scannen)
4. [LOT-Nummer erfassen](#lot-nummer-erfassen)
5. [Produktseite](#produktseite)
6. [Produkt-Chat](#produkt-chat)
7. [Beanstandung melden](#beanstandung-melden)
8. [Profil und Verlauf](#profil-und-verlauf)

---

## Anmeldung

Track my Food verwendet **Keycloak** als Identity Provider. Beim ersten Öffnen der App werden Sie zur Anmeldeseite weitergeleitet.

### Schritte

1. Öffnen Sie die App unter `http://localhost:5173`.
2. Klicken Sie auf **Anmelden** — Sie werden zur Keycloak-Loginseite weitergeleitet.
3. Geben Sie Ihre Zugangsdaten ein.
4. Nach erfolgreicher Anmeldung werden Sie automatisch zur Startseite zurückgeleitet.

> **Demo-Konto für Konsument:innen:**
> - Benutzername: `user-demo`
> - Passwort: `demo1234`

Die Anmeldeseite ist mit einem eigenen Keycloak-Theme gestaltet und zeigt das Track-my-Food-Branding.

*Siehe Screenshot: `docs/screenshots/01-login.png` und `docs/screenshots/02-keycloak-login.png`*

---

## Startseite

Nach der Anmeldung landen Sie auf der **Startseite**. Hier sehen Sie:

- **Scan-Button** — Die primäre Aktion: ein Produkt scannen
- **Zuletzt gescannte Produkte** — Ihre letzten Scans als schnelle Übersicht

Die Startseite ist bewusst einfach gehalten. Der Fokus liegt auf dem Scan.

*Siehe Screenshot: `docs/screenshots/03-home.png`*

---

## Barcode scannen

### So funktioniert der Scan

1. Tippen Sie auf den **Scan-Button** auf der Startseite.
2. Die Kamera Ihres Geräts wird aktiviert.
3. Halten Sie den **Barcode (EAN/GTIN)** des Produkts vor die Kamera.
4. Die App erkennt den Code automatisch — ein manuelles Auslösen ist nicht nötig.
5. Nach erfolgreicher Erkennung werden Sie direkt zur Produktseite weitergeleitet.

### Technische Details

Die App nutzt die native **BarcodeDetector-API** des Browsers. Auf Geräten, die diese API nicht unterstützen (z.B. Firefox), wird automatisch ein **zxing-wasm**-Fallback verwendet. Sie müssen nichts konfigurieren — der Fallback funktioniert transparent.

### Unterstützte Codes

- EAN-13 (Standard-Barcode auf Lebensmitteln)
- GTIN-13 (internationales Format)

---

## LOT-Nummer erfassen

Für die chargenbasierte Rückverfolgung kann die LOT-Nummer (Chargennummer) direkt von der Verpackung gelesen werden.

### So funktioniert die LOT-Erfassung

1. Auf der Produktseite tippen Sie auf **LOT erfassen**.
2. Die Kamera wird aktiviert.
3. Fotografieren Sie den Bereich der Verpackung, auf dem die LOT-Nummer aufgedruckt ist.
4. Die **KI-gestützte OCR** (Semantic Kernel + Gemini Vision) extrahiert die Chargennummer automatisch.
5. Die App zeigt die erkannte LOT-Nummer zur Bestätigung an.
6. Nach Bestätigung wird die spezifische Charge geladen — mit allen zugehörigen Journey-Daten.

> **Tipp:** LOT-Nummern sind oft klein gedruckt auf der Rückseite der Verpackung, in der Nähe des Mindesthaltbarkeitsdatums.

---

## Produktseite

Die Produktseite ist das Herzstück der App. Sie zeigt alle Informationen zu einem gescannten Produkt und seiner Charge.

*Siehe Screenshot: `docs/screenshots/04-product-map.png`*

### Karte (oberer Bereich)

Die interaktive **Journey Map** zeigt die Reise der Charge auf einer Karte:

- **Routenpolylinien** — Echte Strassenrouten zwischen den Stationen (via OpenRouteService)
- **Stationsmarker** — Jede Station der Lieferkette als Punkt auf der Karte
- **Fly-to-Animationen** — Beim Scrollen durch die Timeline fliegt die Kamera zur jeweiligen Station
- **Statusfarben** — Grün (OK), Orange (Warnung), Rot (Rückruf)

### Drawer (unterer Bereich)

Der Drawer lässt sich nach oben ziehen und enthält alle Produktdetails in mehreren Sektionen:

#### Journey-Timeline

Eine scrollbare Timeline zeigt die Stationen der Lieferung — vergleichbar mit Pakettracking:

- **Ernte** — Ursprung der Rohstoffe mit Farmdetails
- **Verarbeitung** — Fabrikation und Qualitätskontrollen
- **Transport** — Transportweg mit Temperaturaufzeichnung
- **Lager** — Zwischenlagerung im Zentrallager
- **Regal** — Aktuelle Position im Verkaufsregal

Jede Station zeigt: Ort, Zeitpunkt, Temperatur, CO₂-Ausstoss und Details.

#### Nährwerte und Nutri-Score

- **Nutri-Score** (A bis E) — Gesamtbewertung der Nährwertqualität
- **NOVA-Gruppe** (1 bis 4) — Verarbeitungsgrad
- **Detaillierte Nährwerte** — Kalorien, Fett, Kohlenhydrate, Eiweiss, Salz etc.

#### Blockchain-Verifikation

Ein **SHA-256-Hash-Chain** stellt sicher, dass die Lieferkettendaten nicht manipuliert wurden:

- Jeder Journey-Event wird gehasht
- Jeder Hash baut auf dem vorherigen auf
- Eine Manipulation an einem Event würde die gesamte Kette ungültig machen
- Der Verifikationsstatus wird visuell angezeigt (verifiziert / nicht verifiziert)

#### Shelf-Life-Prognose

Die KI berechnet eine **Qualitätskurve** für die Charge:

- **Verbleibende Haltbarkeit** in Tagen und Prozent
- **Risikofaktoren** — Welche Faktoren die Haltbarkeit beeinflussen (z.B. Kühlkettenbruch)
- **Konfidenzwert** — Wie sicher die Prognose ist

#### Anomalie-Erkennung

Die App überwacht die **Kühlkette** und erkennt Abweichungen:

- **Temperaturspitzen** — Zeitpunkte, an denen die Temperatur den Grenzwert überschritten hat
- **Kettenintegrität** — Gesamtbewertung der Kühlkette in Prozent
- **Risikobewertung** — Wie stark die Abweichung die Produktqualität beeinflusst

#### Nachhaltigkeit

Eine Aufschlüsselung der ökologischen Auswirkungen:

- **CO₂-Bilanz** — Aufgeteilt nach Ernte, Verarbeitung, Transport und Lagerung
- **Wasserfussabdruck** — Gesamtverbrauch in Litern
- **Transportdistanz** — Gesamtweg in Kilometern (berechnet via Haversine)
- **Verpackungsbewertung** — Bewertung der Verpackungsnachhaltigkeit
- **Eco-Score** — Gesamtbewertung (A bis E)

#### Produktalternativen

Falls Alternativen mit besserem Nachhaltigkeits- oder Nährwertprofil verfügbar sind, werden sie hier vorgeschlagen.

---

## Produkt-Chat

Der **Produkt-Chat** ermöglicht es, Fragen zu einem Produkt in natürlicher Sprache zu stellen.

### So funktioniert der Chat

1. Auf der Produktseite tippen Sie auf das **Chat-Symbol**.
2. Stellen Sie eine Frage, z.B.:
   - *„Ist dieses Produkt für Allergiker geeignet?"*
   - *„Woher kommt der Kakao?"*
   - *„Was bedeutet die Warnung?"*
   - *„Wie nachhaltig ist dieses Produkt?"*
3. Die KI antwortet basierend auf dem **vollständigen Produktkontext** (Journey-Daten, Nährwerte, Alerts, Nachhaltigkeitsdaten).

### Technik

Der Chat nutzt **RAG (Retrieval-Augmented Generation)** via Microsoft Semantic Kernel. Die KI hat Zugriff auf alle Daten des aktuellen Produkts und kann präzise, kontextbezogene Antworten geben.

---

## Beanstandung melden

Wenn Sie ein Problem mit einem Produkt feststellen, können Sie dies direkt in der App melden.

### So melden Sie eine Beanstandung

1. Auf der Produktseite tippen Sie auf **Problem melden**.
2. Folgen Sie dem mehrstufigen Melde-Flow:
   - **Kategorie wählen** — z.B. Qualitätsproblem, Verpackungsschaden, Geschmack
   - **Beschreibung eingeben** — Beschreiben Sie das Problem in eigenen Worten
   - **Absenden** — Ihre Meldung wird in der Datenbank gespeichert
3. Die Meldung wird im **Vendor Portal** für den Hersteller sichtbar.

> **Hinweis:** Ihre Meldung hilft aktiv, die Lebensmittelsicherheit zu verbessern. Hersteller und Händler sehen Ihre Beanstandung im Dashboard und können entsprechend reagieren.

---

## Profil und Verlauf

### Profil

Über das Profil-Icon erreichen Sie Ihre persönlichen Einstellungen:

- **Kontoinformationen** — Name, E-Mail (aus Keycloak)
- **Abmelden** — Sicher abmelden

*Siehe Screenshot: `docs/screenshots/05-profile.png`*

### Scan-Verlauf

Auf der Startseite sehen Sie Ihre zuletzt gescannten Produkte. Tippen Sie auf ein Produkt, um direkt zur Produktseite zu gelangen.

---

## Häufige Fragen

### Der Scanner erkennt meinen Barcode nicht.

- Stellen Sie sicher, dass ausreichend Licht vorhanden ist.
- Halten Sie das Produkt ruhig vor die Kamera.
- Achten Sie darauf, dass der Barcode vollständig im Kameraausschnitt sichtbar ist.
- Falls der Barcode beschädigt ist, können Sie die GTIN-Nummer auch manuell eingeben.

### Was bedeutet der Status „Warnung"?

Eine Warnung weist auf ein erkanntes Risiko hin, z.B. eine Kühlkettenunterbrechung. Das Produkt ist möglicherweise noch sicher, aber die Qualität könnte beeinträchtigt sein. Lesen Sie die Details auf der Produktseite.

### Was bedeutet der Status „Rückruf"?

Ein Rückruf bedeutet, dass das Produkt vom Hersteller oder einer Behörde (z.B. BLV) zurückgerufen wurde. **Konsumieren Sie das Produkt nicht** und bringen Sie es in den Laden zurück.

### Mein Produkt wird nicht gefunden.

Nicht alle Produkte sind in der Datenbank erfasst. Wenn ein GTIN nicht bekannt ist, versucht die App automatisch, Produktdaten von **Open Food Facts** abzurufen. Falls auch das nicht gelingt, wird eine entsprechende Meldung angezeigt.
