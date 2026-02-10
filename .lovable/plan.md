

# MOD-20 MIETY — Ueberarbeiteter Plan v4

## Wichtigste Aenderung gegenueber v3

**Soll/Ist als ZWEI SEPARATE Kacheln** statt einer geteilten Kachel. Auf Desktop stehen sie nebeneinander (`grid-cols-2`), auf Mobile stapeln sie sich automatisch untereinander (`grid-cols-1`). Das ist mobilfreundlich und klar getrennt.

**Arlo Produktbilder**: Werden per AI Image Generation (Gemini) als hochwertige Produktbilder erzeugt und im Projekt gespeichert — realistische Darstellungen der Arlo Pro 5S und SmartHub. Ebenso 3 Kamera-Snapshot-Platzhalter (Eingang/Garten/Innen) fuer die Live-Widgets.

---

## Tab-Struktur (6 Tabs)

```text
Tab 1: Uebersicht        (bestehend + Kamera-Widgets Row 2 + Wohnflaeche/Objektart)
Tab 2: Versorgung         (bestehend + Zaehlerstaende integriert + Rabot Energy SEPARATE Kachel)
Tab 3: Versicherungen     (bestehend + Neo Digital SEPARATE Kachel)
Tab 4: Smart Home         (NEU — Arlo Shop + Kamera-Aktivierung)
Tab 5: Einstellungen      (NEU — API-Verbindungen)
Tab 6: Kommunikation      (bestehend)
```

---

## Aenderung 1: Manifest

**Datei:** `src/manifests/routesManifest.ts`

- Entferne `zaehlerstaende` Tile
- Fuege `smarthome` und `einstellungen` hinzu
- Ergebnis: 6 Tiles

```text
tiles:
  - uebersicht
  - versorgung
  - versicherungen
  - smarthome
  - einstellungen
  - kommunikation
```

---

## Aenderung 2: Uebersicht — Kamera-Widgets + erweiterte Adresskarte

**Datei:** `src/pages/portal/MietyPortalPage.tsx` (UebersichtTile)

### 2.1 Adress-Kachel erweitern

Zusaetzliche Badges:
- **Wohnflaeche** (z.B. "85 m2") — `area_sqm`
- **Objektart** (z.B. "Wohnung") — `property_type`

Diese Felder existieren bereits in `miety_homes` und werden schon angezeigt. Nur sicherstellen, dass sie prominent sind.

### 2.2 Kamera-Widgets (Row 2, 3 Kacheln)

Unter dem bestehenden 3-Kachel-Grid ein zweites Grid:

| Kachel | Name | Status | Snapshot |
|---|---|---|---|
| Kamera 1 | Eingang | Online (gruen) | AI-generiertes Bild: Hauseingang bei Tag |
| Kamera 2 | Garten | Online (gruen) | AI-generiertes Bild: Gartenansicht |
| Kamera 3 | Innen | Offline (grau) | AI-generiertes Bild: Wohnzimmer |

Jede Kachel:
- Snapshot-Bild als Hintergrund (nicht grauer Platzhalter!)
- Roter pulsierender "LIVE" Badge oben rechts
- Status-Badge oben links (Online/Offline)
- Timestamp unten links (z.B. "Gerade eben")
- Actions via Drawer: "Live ansehen", "Events", "Einstellungen"

Darunter: CTA "+ Kamera hinzufuegen" (Drawer-Stub)

### 2.3 Schnellzugriff aktualisieren

"Zaehler" Quick-Card zeigt auf `versorgung` statt `zaehlerstaende`.

---

## Aenderung 3: Versorgung — ZWEI SEPARATE Kacheln pro Kategorie

**Datei:** `src/pages/portal/MietyPortalPage.tsx` (VersorgungTile)

### Layout-Pattern: Zwei Kacheln nebeneinander

Fuer jede Versorgungskategorie (Strom, Gas, Wasser, Internet) ein Kachel-Paar:

```text
Desktop (sm+):
+---------------------------+  +---------------------------+
|  IST: Ihr Stromvertrag    |  |  SOLL: Rabot Energy       |
|  [Anbieter, Kosten...]    |  |  [Boersenpreis, Ersparnis]|
|  [Zaehlerstand-Bereich]   |  |  [Jetzt wechseln CTA]     |
+---------------------------+  +---------------------------+

Mobile:
+---------------------------+
|  IST: Ihr Stromvertrag    |
+---------------------------+
+---------------------------+
|  SOLL: Rabot Energy       |
+---------------------------+
```

Umgesetzt als `grid grid-cols-1 sm:grid-cols-2 gap-4` pro Kategorie-Paar.

### Linke Kachel: IST (bestehender Vertrag)

- Bestehende Vertragskarte (wie jetzt) PLUS:
- **Zaehlerstand-Bereich** (aus ZaehlerstaendeTile migriert):
  - Icon + letzter Wert + Datum
  - Button "Neuen Stand erfassen" (Drawer)
  - Trend-Icon (Stub)

### Rechte Kachel: SOLL (unser Angebot)

- **Bei Strom: Rabot Energy White-Label**
  - Titel: "Rabot Charge — Strom zum Boersenpreis"
  - Gruener Akzent-Gradient Header
  - Beispielpreis: "ca. 28,5 ct/kWh (dynamisch)"
  - Vergleichsrechnung: "Sie zahlen aktuell X EUR → mit Rabot ca. Y EUR"
  - Einsparung-Badge: "bis zu 15% sparen"
  - CTA "Jetzt wechseln" (Stub)

- **Bei Gas:** "Gasanbieter-Vergleich — demnachst verfuegbar" (ausgegraut)
- **Bei Wasser/Internet:** "Vergleich nicht verfuegbar" (ausgegraut, dezent)

### ZaehlerstaendeTile entfernen

Die gesamte `ZaehlerstaendeTile` Funktion wird geloescht. Meter-Reading-Query wird in `VersorgungTile` integriert.

---

## Aenderung 4: Versicherungen — ZWEI SEPARATE Kacheln

**Datei:** `src/pages/portal/MietyPortalPage.tsx` (VersicherungenTile)

### Gleiches Pattern: Zwei Kacheln nebeneinander

```text
Desktop:
+---------------------------+  +---------------------------+
|  IST: Ihre Hausrat-       |  |  SOLL: Neo Digital        |
|  versicherung             |  |  Vergleichsangebot        |
|  [Versicherer, Kosten]    |  |  [ab 4,90 EUR/Monat]      |
|  [Dokumente Download]     |  |  [Angebot anfordern CTA]  |
+---------------------------+  +---------------------------+
```

### Linke Kachel: IST (bestehende Versicherung)

- Wie bisher PLUS:
- Dokumente-Bereich: "Unterlagen herunterladen" (Stub-Link)

### Rechte Kachel: SOLL (Neo Digital Vergleich)

- Titel: "Neo Digital — Vergleichsangebot"
- Blauer Akzent-Header
- Objektdaten automatisch: Wohnflaeche + Objektart + PLZ (aus `miety_homes`)
- Beispielpreise:
  - Hausrat: "ab 4,90 EUR/Monat (Grundschutz)" / "ab 8,50 EUR/Monat (Komfort)"
  - Haftpflicht: "ab 3,50 EUR/Monat"
- Einsparung-Badge wenn IST vorhanden
- CTA "Angebot anfordern" (Stub)
- CTA "Mehr erfahren" (Link-Stub)

---

## Aenderung 5: Smart Home Tab (NEU)

**Datei:** `src/pages/portal/MietyPortalPage.tsx` (neue Komponente `SmartHomeTile`)

### 5.1 Kamera-Verwaltung

"Meine Kameras" mit Toggle pro Kamera:
- "Am Dashboard anzeigen" (UI-only Stub)

### 5.2 Arlo Shop mit echten Produktbildern

**Bilder**: 4 Produktbilder werden per AI Image Generation erzeugt (Arlo Pro 5S weiss, Arlo SmartHub weiss) und als statische Assets gespeichert.

Starter-Set Banner:
- "Starter Set — Arlo Premium: 3 Kameras + SmartHub"
- Gesamtpreis: "Komplett ab 589,96 EUR"

4 Produktkarten (2x2 Grid):

| Produkt | Preis | Badges | Bild |
|---|---|---|---|
| Arlo Pro 5S 2K #1 | ab 179,99 EUR | 2K HDR, Akku, WLAN, 160 Grad | AI-generiert |
| Arlo Pro 5S 2K #2 | ab 179,99 EUR | 2K HDR, Akku, WLAN, 160 Grad | AI-generiert |
| Arlo Pro 5S 2K #3 | ab 179,99 EUR | 2K HDR, Akku, WLAN, 160 Grad | AI-generiert |
| Arlo SmartHub | ab 49,99 EUR | WiFi, ZigBee, microSD | AI-generiert |

CTAs: "Bei Arlo kaufen" (Link-Stub), "Mit System verbinden" (disabled)

---

## Aenderung 6: Einstellungen Tab (NEU)

**Datei:** `src/pages/portal/MietyPortalPage.tsx` (neue Komponente `EinstellungenTile`)

3 Integration-Cards (Accordion):

| Integration | Felder | Status |
|---|---|---|
| Rabot Energy | API Key, Partner ID | Nicht verbunden |
| Neo Digital | API Key, Makler-ID | Nicht verbunden |
| Arlo Smart Home | API Key, Account E-Mail | Nicht verbunden |

---

## Aenderung 7: Index-Route Fix

Redirect von `/portal/miety` direkt auf `uebersicht` (kein HowItWorks).

---

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | "zaehlerstaende" entfernen, "smarthome" + "einstellungen" hinzufuegen (6 Tiles) |
| `src/pages/portal/MietyPortalPage.tsx` | ZaehlerstaendeTile loeschen. VersorgungTile: Zwei-Kachel-Pattern + Zaehlerstaende + Rabot. VersicherungenTile: Zwei-Kachel-Pattern + Neo Digital. Neue SmartHomeTile (Arlo Shop mit AI-Bildern). Neue EinstellungenTile (3 API-Cards). UebersichtTile: Kamera Row 2 mit Snapshot-Bildern + Badges. Index-Route Redirect. Quick-Access "Zaehler" auf "versorgung". |

### AI-generierte Bilder (7 Stueck)
- 3x Kamera-Snapshots (Eingang Tag, Garten, Wohnzimmer) fuer Uebersicht
- 3x Arlo Pro 5S Produktfoto (weisse Kamera, Studiofoto-Stil)
- 1x Arlo SmartHub Produktfoto (weisser Hub, Studiofoto-Stil)

### Keine Datenbank-Aenderungen
Reines Frontend-MVP. Alle Daten statisch/Platzhalter.

